import { ChatMessage } from "@jbcbdse/charlie-core";
import * as path from "path";
import { existsSync } from "fs";
import * as fs from "fs/promises";

const dir = path.resolve(process.cwd(), "tmp");
const SAFE_USER_ID = /^[A-Za-z0-9_-]{1,128}$/;

export function assertSafeUserId(userId: string): string {
  if (!SAFE_USER_ID.test(userId)) {
    throw new Error("Invalid user id");
  }
  return userId;
}

function messageFile(userId: string): string {
  const safeId = assertSafeUserId(userId);
  const file = path.resolve(dir, `messages.${safeId}.json`);
  if (!file.startsWith(dir + path.sep)) {
    throw new Error("Invalid user id");
  }
  return file;
}

async function ensureDir(): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export async function getMessages(userId: string): Promise<ChatMessage[]> {
  const file = messageFile(userId);
  if (!existsSync(file)) {
    return [];
  }
  const fileContents = await fs.readFile(file, "utf-8");
  return JSON.parse(fileContents);
}

export async function saveMesssages(
  userId: string,
  messages: ChatMessage[],
): Promise<void> {
  await ensureDir();
  const existingMessages = await getMessages(userId);
  const file = messageFile(userId);
  await fs.writeFile(
    file,
    JSON.stringify([...existingMessages, ...messages], null, 2),
  );
}

export async function clearMessages(userId: string): Promise<void> {
  const file = messageFile(userId);
  if (existsSync(file)) {
    await fs.unlink(file);
  }
}
