import { MongoClient } from "mongodb";

const mongodbAddress = process.env.MONGODB_URL;
const DEFAULT_DB = "activitypub";
const options = {
  connectTimeoutMS: 10000,
  maxIdleTimeMS: 10000,
};

let client = new MongoClient(mongodbAddress, options);
export const clientPromise = client.connect();

const connetToMongo = async () => {
  return (await clientPromise).db(DEFAULT_DB);
};

export const close = async () => {
  // todo
};

export const getCollection = async collectionName => {
  const db = await connetToMongo();
  return db.collection(collectionName);
};

export const insertOne = async (collectionName, oneRecord) => {
  const table = await getCollection(collectionName);
  return table.insertOne(oneRecord);
};

export const findByField = async (collectionName, query) => {
  const table = await getCollection(collectionName);
  return await table.find(query).toArray();
};
