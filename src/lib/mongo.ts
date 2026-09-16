import { MongoClient } from "mongodb";
import { ChatMemory, ChatDocument, MessageDocument } from "./chat-memory";

const globalForMongo = globalThis as unknown as {
  mongoConnect?: Promise<MongoClient>;
  mongoIndexes?: Promise<void>;
};

function mongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }
  return uri;
}

async function getClient(): Promise<MongoClient> {
  if (!globalForMongo.mongoConnect) {
    const client = new MongoClient(mongoUri());
    globalForMongo.mongoConnect = client.connect();
  }
  return globalForMongo.mongoConnect;
}

export async function getChatMemory(): Promise<ChatMemory> {
  const db = (await getClient()).db();
  const memory = new ChatMemory(
    db.collection<ChatDocument>("chats"),
    db.collection<MessageDocument>("messages"),
  );
  if (!globalForMongo.mongoIndexes) {
    globalForMongo.mongoIndexes = memory.ensureIndexes();
  }
  await globalForMongo.mongoIndexes;
  return memory;
}
