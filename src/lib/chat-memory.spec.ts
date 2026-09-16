import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";
import { ChatMemory, ChatDocument, MessageDocument } from "./chat-memory";
import { DEFAULT_CHAT_TITLE } from "./chat-types";

class MemoryCollection<T extends { _id: ObjectId }> {
  docs: T[] = [];

  async insertOne(doc: T): Promise<{ insertedId: ObjectId }> {
    this.docs.push(this.clone(doc));
    return { insertedId: doc._id };
  }

  async insertMany(docs: T[]): Promise<void> {
    this.docs.push(...docs.map((doc) => this.clone(doc)));
  }

  async findOne(filter: Record<string, unknown>): Promise<T | null> {
    return this.clone(this.docs.find((doc) => this.matches(doc, filter))) ?? null;
  }

  find(filter: Record<string, unknown>) {
    const matched = this.docs.filter((doc) => this.matches(doc, filter));
    return {
      sort: (sort: Record<string, 1 | -1>) => ({
        toArray: async () => this.sortDocs(matched, sort).map((doc) => this.clone(doc)),
      }),
      toArray: async () => matched.map((doc) => this.clone(doc)),
    };
  }

  async updateOne(
    filter: Record<string, unknown>,
    update: { $set: Record<string, unknown> },
  ): Promise<{ modifiedCount: number }> {
    const doc = this.docs.find((item) => this.matches(item, filter));
    if (!doc) {
      return { modifiedCount: 0 };
    }
    Object.assign(doc, update.$set);
    return { modifiedCount: 1 };
  }

  async deleteOne(
    filter: Record<string, unknown>,
  ): Promise<{ deletedCount: number }> {
    const index = this.docs.findIndex((doc) => this.matches(doc, filter));
    if (index === -1) {
      return { deletedCount: 0 };
    }
    this.docs.splice(index, 1);
    return { deletedCount: 1 };
  }

  async deleteMany(
    filter: Record<string, unknown>,
  ): Promise<{ deletedCount: number }> {
    const before = this.docs.length;
    this.docs = this.docs.filter((doc) => !this.matches(doc, filter));
    return { deletedCount: before - this.docs.length };
  }

  private matches(doc: T, filter: Record<string, unknown>): boolean {
    return Object.entries(filter).every(([key, value]) =>
      this.equal((doc as Record<string, unknown>)[key], value),
    );
  }

  private equal(left: unknown, right: unknown): boolean {
    if (left instanceof ObjectId && right instanceof ObjectId) {
      return left.equals(right);
    }
    return left === right;
  }

  private sortDocs(docs: T[], sort: Record<string, 1 | -1>): T[] {
    const entries = Object.entries(sort);
    return [...docs].sort((a, b) => {
      for (const [key, direction] of entries) {
        const av = (a as Record<string, unknown>)[key];
        const bv = (b as Record<string, unknown>)[key];
        if (av === bv) continue;
        if (av instanceof Date && bv instanceof Date) {
          return direction * (av.getTime() - bv.getTime());
        }
        if (typeof av === "number" && typeof bv === "number") {
          return direction * (av - bv);
        }
        if (typeof av === "string" && typeof bv === "string") {
          return direction * av.localeCompare(bv);
        }
        return 0;
      }
      return 0;
    });
  }

  private clone<V>(value: V): V {
    if (value == null || value instanceof ObjectId) {
      return value;
    }
    if (value instanceof Date) {
      return new Date(value.getTime()) as V;
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.clone(item)) as V;
    }
    if (typeof value === "object") {
      const copy = {} as V;
      for (const [key, item] of Object.entries(value)) {
        (copy as Record<string, unknown>)[key] = this.clone(item);
      }
      return copy;
    }
    return value;
  }
}

function memory(): ChatMemory {
  return new ChatMemory(
    new MemoryCollection<ChatDocument>() as never,
    new MemoryCollection<MessageDocument>() as never,
  );
}

describe("ChatMemory validation", () => {
  it("lowercases email", async () => {
    const store = memory();
    const chat = await store.createChat("Alex@Example.COM");
    const listed = await store.listChats("alex@example.com");
    expect(listed).toHaveLength(1);
    expect(listed[0].id).toBe(chat.id);
  });

  it("normalizes and limits custom titles", async () => {
    const store = memory();
    const chat = await store.createChat(
      "user@example.com",
      `  ${"long ".repeat(30)}  `,
    );
    expect(chat.title).toHaveLength(80);
    expect(chat.title).not.toContain("  ");
  });

  it("rejects invalid email", async () => {
    const store = memory();
    await expect(store.listChats("")).rejects.toThrow("Invalid email");
    await expect(store.listChats("not-an-email")).rejects.toThrow(
      "Invalid email",
    );
    await expect(store.createChat("../secret")).rejects.toThrow("Invalid email");
  });

  it("rejects invalid chat id", async () => {
    const store = memory();
    await expect(
      store.getMessages("a@b.co", "../../../secret"),
    ).rejects.toThrow("Invalid chat id");
    await expect(store.getChat("a@b.co", "not-an-objectid")).rejects.toThrow(
      "Invalid chat id",
    );
  });
});

describe("ChatMemory isolation", () => {
  it("stores messages per chat", async () => {
    const store = memory();
    const chat = await store.createChat("user@example.com");
    await store.appendMessages("user@example.com", chat.id, [
      { role: "user", name: "User", content: "hi" },
    ]);
    const messages = await store.getMessages("user@example.com", chat.id);
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      role: "user",
      content: "hi",
    });
    await store.clearMessages("user@example.com", chat.id);
    expect(await store.getMessages("user@example.com", chat.id)).toEqual([]);
  });

  it("does not leak chats or messages across emails", async () => {
    const store = memory();
    const chat = await store.createChat("owner@example.com", "secret");
    await store.appendMessages("owner@example.com", chat.id, [
      { role: "user", name: "User", content: "private" },
    ]);
    expect(await store.listChats("other@example.com")).toEqual([]);
    await expect(
      store.getMessages("other@example.com", chat.id),
    ).rejects.toThrow("Chat not found");
    await expect(
      store.appendMessages("other@example.com", chat.id, [
        { role: "user", name: "User", content: "nope" },
      ]),
    ).rejects.toThrow("Chat not found");
    expect(await store.deleteChat("other@example.com", chat.id)).toBe(false);
    expect(
      await store.getMessages("owner@example.com", chat.id),
    ).toHaveLength(1);
  });

  it("sets title from the first user message and deletes messages with the chat", async () => {
    const store = memory();
    const chat = await store.createChat("user@example.com");
    expect(chat.title).toBe(DEFAULT_CHAT_TITLE);
    await store.appendMessages("user@example.com", chat.id, [
      { role: "user", name: "User", content: "Plan the picnic" },
      { role: "assistant", name: "gpt4o", content: "sure" },
    ]);
    const updated = await store.getChat("user@example.com", chat.id);
    expect(updated?.title).toBe("Plan the picnic");
    expect(await store.deleteChat("user@example.com", chat.id)).toBe(true);
    await expect(
      store.getMessages("user@example.com", chat.id),
    ).rejects.toThrow("Chat not found");
  });
});
