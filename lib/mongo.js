import { MongoClient } from "mongodb";
import URL from "url";

const mongodbAddress = process.env.MONGODB_URL;
let cachedDb = null;
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  connectTimeoutMS: 10000,
  maxIdleTimeMS: 10000,
};

let client = new MongoClient(mongodbAddress, options);
export const clientPromise = client.connect();

const connetToMongo = async url => {
  if (cachedDb) {
    return cachedDb;
  }
  const client = await MongoClient.connect(url, options);
  const db = client.db(URL.parse(url).pathname.substr(1));
  cachedDb = db;
  return db;
};

export const close = async () => {
  // todo
};

export const getCollection = async collectionName => {
  const db = await connetToMongo(mongodbAddress);
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
