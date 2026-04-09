import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.warn("MONGODB_URI is not set. MongoDB features will stay disabled.");
}

declare global {
  // eslint-disable-next-line no-var
  var __mongoClientPromise__: Promise<MongoClient> | undefined;
}

export function isMongoConfigured() {
  return Boolean(uri);
}

export async function getMongoClient() {
  if (!uri) {
    throw new Error("Missing MONGODB_URI in .env.local");
  }

  if (!global.__mongoClientPromise__) {
    const client = new MongoClient(uri);
    global.__mongoClientPromise__ = client.connect();
  }

  return global.__mongoClientPromise__;
}
