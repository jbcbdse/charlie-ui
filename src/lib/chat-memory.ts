import { ChatMessage } from "@jbcbdse/charlie-core";
import { Collection, ObjectId } from "mongodb";
import {
  ChatSummary,
  DEFAULT_CHAT_TITLE,
} from "./chat-types";

export type ChatDocument = {
  _id: ObjectId;
  userEmail: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
};

export type MessageDocument = {
  _id: ObjectId;
  chatId: ObjectId;
  userEmail: string;
  createdAt: Date;
} & ChatMessage;

const EMAIL =
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const CHAT_ID = /^[a-fA-F0-9]{24}$/;
const MAX_EMAIL_LENGTH = 254;
const TITLE_MAX = 80;

export class ChatMemory {
  constructor(
    private readonly chats: Collection<ChatDocument>,
    private readonly messages: Collection<MessageDocument>,
  ) {}

  async ensureIndexes(): Promise<void> {
    await this.chats.createIndex({ userEmail: 1, updatedAt: -1 });
    await this.messages.createIndex({
      chatId: 1,
      userEmail: 1,
      createdAt: 1,
    });
  }

  async listChats(userEmail: string): Promise<ChatSummary[]> {
    const email = this.assertEmail(userEmail);
    const docs = await this.chats
      .find({ userEmail: email })
      .sort({ updatedAt: -1 })
      .toArray();
    return docs.map((doc) => this.toSummary(doc));
  }

  async createChat(
    userEmail: string,
    title = DEFAULT_CHAT_TITLE,
  ): Promise<ChatSummary> {
    const email = this.assertEmail(userEmail);
    const now = new Date();
    const doc: ChatDocument = {
      _id: new ObjectId(),
      userEmail: email,
      title: this.normalizeTitle(title),
      createdAt: now,
      updatedAt: now,
    };
    await this.chats.insertOne(doc);
    return this.toSummary(doc);
  }

  async getChat(
    userEmail: string,
    chatId: string,
  ): Promise<ChatSummary | null> {
    const chat = await this.findChat(userEmail, chatId);
    return chat ? this.toSummary(chat) : null;
  }

  async deleteChat(userEmail: string, chatId: string): Promise<boolean> {
    const email = this.assertEmail(userEmail);
    const id = this.assertChatId(chatId);
    const result = await this.chats.deleteOne({
      _id: id,
      userEmail: email,
    });
    if (result.deletedCount === 0) {
      return false;
    }
    await this.messages.deleteMany({ chatId: id, userEmail: email });
    return true;
  }

  async getMessages(
    userEmail: string,
    chatId: string,
  ): Promise<ChatMessage[]> {
    const chat = await this.findChat(userEmail, chatId);
    if (!chat) {
      throw new Error("Chat not found");
    }
    const docs = await this.messages
      .find({ chatId: chat._id, userEmail: chat.userEmail })
      .sort({ createdAt: 1 })
      .toArray();
    return docs.map((doc) => this.toChatMessage(doc));
  }

  async appendMessages(
    userEmail: string,
    chatId: string,
    messages: ChatMessage[],
  ): Promise<void> {
    const chat = await this.findChat(userEmail, chatId);
    if (!chat) {
      throw new Error("Chat not found");
    }
    if (messages.length === 0) {
      return;
    }
    const now = new Date();
    await this.messages.insertMany(
      messages.map((message, index) => ({
        ...message,
        _id: new ObjectId(),
        chatId: chat._id,
        userEmail: chat.userEmail,
        createdAt: new Date(now.getTime() + index),
      })) as MessageDocument[],
    );
    const update: { updatedAt: Date; title?: string } = { updatedAt: now };
    if (chat.title === DEFAULT_CHAT_TITLE) {
      const title = this.titleFromMessages(messages);
      if (title) {
        update.title = title;
      }
    }
    await this.chats.updateOne(
      { _id: chat._id, userEmail: chat.userEmail },
      { $set: update },
    );
  }

  async clearMessages(userEmail: string, chatId: string): Promise<void> {
    const chat = await this.findChat(userEmail, chatId);
    if (!chat) {
      throw new Error("Chat not found");
    }
    await this.messages.deleteMany({
      chatId: chat._id,
      userEmail: chat.userEmail,
    });
    await this.chats.updateOne(
      { _id: chat._id, userEmail: chat.userEmail },
      { $set: { updatedAt: new Date() } },
    );
  }

  private async findChat(
    userEmail: string,
    chatId: string,
  ): Promise<ChatDocument | null> {
    const email = this.assertEmail(userEmail);
    const id = this.assertChatId(chatId);
    return this.chats.findOne({ _id: id, userEmail: email });
  }

  private assertEmail(userEmail: string): string {
    const email = userEmail.trim().toLowerCase();
    if (
      !email ||
      email.length > MAX_EMAIL_LENGTH ||
      !EMAIL.test(email)
    ) {
      throw new Error("Invalid email");
    }
    return email;
  }

  private assertChatId(chatId: string): ObjectId {
    if (!CHAT_ID.test(chatId)) {
      throw new Error("Invalid chat id");
    }
    return new ObjectId(chatId);
  }

  private toSummary(doc: ChatDocument): ChatSummary {
    return {
      id: doc._id.toHexString(),
      title: doc.title,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  private toChatMessage(doc: MessageDocument): ChatMessage {
    const { _id: _mongoId, chatId: _chatId, userEmail: _email, createdAt: _created, ...message } =
      doc;
    return message as ChatMessage;
  }

  private titleFromMessages(messages: ChatMessage[]): string | undefined {
    const user = messages.find(
      (message): message is Extract<ChatMessage, { role: "user" }> =>
        message.role === "user" && Boolean(message.content.trim()),
    );
    if (!user) {
      return undefined;
    }
    return this.normalizeTitle(user.content);
  }

  private normalizeTitle(title: string): string {
    const collapsed = title.trim().replace(/\s+/g, " ");
    if (!collapsed) {
      return DEFAULT_CHAT_TITLE;
    }
    return collapsed.slice(0, TITLE_MAX);
  }
}
