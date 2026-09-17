import { Collection, ObjectId } from "mongodb";
import {
  CUSTOM_PROMPT_ID,
  DEFAULT_PROMPT_ID,
  MAX_PROMPT_LENGTH,
  UserSettings,
  defaultUserSettings,
  isPromptId,
  resolveSystemPrompt,
} from "./system-prompts";
import { normalizeMcpConfigJson } from "./mcp-config";

export type UserSettingsDocument = {
  _id: ObjectId;
  userEmail: string;
  systemPromptId: string;
  customSystemPrompt: string;
  mcpConfigJson: string;
  updatedAt: Date;
};

const EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const MAX_EMAIL_LENGTH = 254;

export class UserSettingsStore {
  constructor(
    private readonly users: Collection<UserSettingsDocument>,
  ) {}

  async ensureIndexes(): Promise<void> {
    await this.users.createIndex({ userEmail: 1 }, { unique: true });
  }

  async get(userEmail: string): Promise<UserSettings> {
    const email = this.assertEmail(userEmail);
    const doc = await this.users.findOne({ userEmail: email });
    if (!doc) {
      return defaultUserSettings();
    }
    return this.toSettings(doc);
  }

  async save(
    userEmail: string,
    input: {
      systemPromptId: string;
      customSystemPrompt?: string;
      mcpConfigJson?: string;
    },
  ): Promise<UserSettings> {
    const email = this.assertEmail(userEmail);
    const systemPromptId = this.assertPromptId(input.systemPromptId);
    const customSystemPrompt = this.assertCustomPrompt(
      input.customSystemPrompt ?? "",
    );
    if (systemPromptId === CUSTOM_PROMPT_ID && !customSystemPrompt.trim()) {
      throw new Error("Invalid system prompt");
    }
    const mcpConfigJson =
      input.mcpConfigJson === undefined
        ? ((await this.users.findOne({ userEmail: email }))?.mcpConfigJson ?? "")
        : this.assertMcpConfig(input.mcpConfigJson);
    const now = new Date();
    await this.users.updateOne(
      { userEmail: email },
      {
        $set: {
          userEmail: email,
          systemPromptId,
          customSystemPrompt,
          mcpConfigJson,
          updatedAt: now,
        },
        $setOnInsert: { _id: new ObjectId() },
      },
      { upsert: true },
    );
    return {
      systemPromptId,
      customSystemPrompt,
      systemPromptTemplate: resolveSystemPrompt(
        systemPromptId,
        customSystemPrompt,
      ),
      mcpConfigJson,
    };
  }

  private toSettings(doc: UserSettingsDocument): UserSettings {
    const systemPromptId = isPromptId(doc.systemPromptId)
      ? doc.systemPromptId
      : DEFAULT_PROMPT_ID;
    const customSystemPrompt = doc.customSystemPrompt ?? "";
    const mcpConfigJson = doc.mcpConfigJson ?? "";
    return {
      systemPromptId,
      customSystemPrompt,
      systemPromptTemplate: resolveSystemPrompt(
        systemPromptId,
        customSystemPrompt,
      ),
      mcpConfigJson,
    };
  }

  private assertEmail(userEmail: string): string {
    const email = userEmail.trim().toLowerCase();
    if (!email || email.length > MAX_EMAIL_LENGTH || !EMAIL.test(email)) {
      throw new Error("Invalid email");
    }
    return email;
  }

  private assertPromptId(id: string): string {
    if (!isPromptId(id)) {
      throw new Error("Invalid system prompt");
    }
    return id;
  }

  private assertCustomPrompt(value: string): string {
    if (value.length > MAX_PROMPT_LENGTH) {
      throw new Error("Invalid system prompt");
    }
    return value;
  }

  private assertMcpConfig(value: string): string {
    return normalizeMcpConfigJson(value);
  }
}
