import { MongoClient } from "mongodb";
import URL from "url";

const mongodbAddress = process.env.MONGODB_URL;
let cachedDb = null;

const connetToMongo = async url => {
  if (cachedDb) {
    console.log("Reuse mongo client");
    return cachedDb;
  }
  const client = await MongoClient.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    connectTimeoutMS: 20000,
  });
  const db = await client.db(URL.parse(url).pathname.substr(1));
  cachedDb = db;
  return db;
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
