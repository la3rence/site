import { MongoClient } from "mongodb";

const DEFAULT_DB = "activitypub";
const options = {
  connectTimeoutMS: 10000,
  maxIdleTimeMS: 10000,
};

let clientPromise;

const getClientPromise = () => {
  if (!process.env.MONGODB_URL) {
    throw new Error("MONGODB_URL is not configured");
  }
  if (!clientPromise) {
    const client = new MongoClient(process.env.MONGODB_URL, options);
    clientPromise = client.connect();
  }
  return clientPromise;
};

export { clientPromise };

const connectToMongo = async () => {
  const clientPromise = getClientPromise();
  return (await clientPromise).db(DEFAULT_DB);
};

export const getCollection = async collectionName => {
  const db = await connectToMongo();
  return db.collection(collectionName);
};

export const getOptionalCollection = async collectionName => {
  if (!process.env.MONGODB_URL) return null;
  return getCollection(collectionName);
};
