import { MongoClient, type MongoClientOptions } from "mongodb";
import { config, assertConfig } from "@/lib/config";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const options: MongoClientOptions = {
  serverSelectionTimeoutMS: 5000
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    assertConfig();
    client = new MongoClient(config.mongodbUri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  assertConfig();
  client = new MongoClient(config.mongodbUri, options);
  clientPromise = client.connect();
}

export async function getMongoClient() {
  return clientPromise;
}

export async function getDatabase(dbName = "bive") {
  const mongoClient = await getMongoClient();
  return mongoClient.db(dbName);
}
