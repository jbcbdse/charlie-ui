import { MongoClient } from "mongodb";
import { ChatMemory, ChatDocument, MessageDocument } from "./chat-memory";
import { UserSettingsDocument, UserSettingsStore } from "./user-settings";

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
    globalForMongo.mongoConnect = client.connect().catch((error) => {
      globalForMongo.mongoConnect = undefined;
      throw error;
    });
  }
  return globalForMongo.mongoConnect;
}

async function getDb() {
  const db = (await getClient()).db();
  if (!globalForMongo.mongoIndexes) {
    const memory = new ChatMemory(
      db.collection<ChatDocument>("chats"),
      db.collection<MessageDocument>("messages"),
    );
    const settings = new UserSettingsStore(
      db.collection<UserSettingsDocument>("usersettings"),
    );
    globalForMongo.mongoIndexes = Promise.all([
      memory.ensureIndexes(),
      settings.ensureIndexes(),
    ])
      .then(() => undefined)
      .catch((error) => {
        globalForMongo.mongoIndexes = undefined;
        throw error;
      });
  }
  await globalForMongo.mongoIndexes;
  return db;
}

export async function getChatMemory(): Promise<ChatMemory> {
  const db = await getDb();
  return new ChatMemory(
    db.collection<ChatDocument>("chats"),
    db.collection<MessageDocument>("messages"),
  );
}

export async function getUserSettingsStore(): Promise<UserSettingsStore> {
  const db = await getDb();
  return new UserSettingsStore(db.collection<UserSettingsDocument>("usersettings"));
}
