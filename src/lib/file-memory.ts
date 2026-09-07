import { ChatMessage } from "@jbcbdse/charlie-core";
import * as path from "path";
import { existsSync } from "fs";
import * as fs from "fs/promises";

const dir = path.resolve(process.cwd(), "tmp");

async function ensureDir(): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export async function getMessages(userId: string): Promise<ChatMessage[]> {
  const file = path.resolve(dir, `messages.${userId}.json`);
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
  const file = path.resolve(dir, `messages.${userId}.json`);
  await fs.writeFile(
    file,
    JSON.stringify([...existingMessages, ...messages], null, 2),
  );
}

export async function clearMessages(userId: string): Promise<void> {
  const file = path.resolve(dir, `messages.${userId}.json`);
  if (existsSync(file)) {
    await fs.unlink(file);
  }
}
