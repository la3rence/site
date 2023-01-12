import env from "./../lib/env";
import { createClient } from "redis";
const { VERCEL_ENV } = env;
const isProd = VERCEL_ENV === "production";

let redis;

const connectRedis = async () => {
  const redisClient = createClient({
    url: env.REDIS_CONNECTION,
    socket: {
      disableOfflineQueue: true,
    },
  });
  redisClient.on("error", err => {
    console.log("Redis Client Error", err);
    redis = null;
  });
  await redisClient.connect();
  redis = redisClient;
  return redis;
};

export const getRedisClient = async () => {
  if (redis) {
    console.log("Reuse redis client.");
    return redis;
  } else {
    if (isProd) {
      console.log("Connect To Redis in PROD...");
      return await connectRedis();
    } else {
      console.log("Mocking Redis in DEV...");
      return { get: () => 1, set: () => {}, incr: () => 2, lRange: () => [] };
    }
  }
};

export const disconnect = async () => {
  if (redis) {
    await redis.disconnect();
    redis = null;
  }
};

// ----- Redis SDK -----
export const readKey = async key => {
  const redis = await getRedisClient();
  const value = await redis.get(key);
  return value;
};

export const writeKeyValue = async (key, value) => {
  const redis = await getRedisClient();
  await redis.set(key, value);
};

export const incrementKey = async key => {
  const redis = await getRedisClient();
  const value = await redis.incr(key);
  return value;
};

export const pushToList = async (key, list) => {
  const redis = await getRedisClient();
  console.log("Push to Redis list: ", key, list);
  await redis.rPush(key, list);
};

export const getList = async key => {
  const redis = await getRedisClient();
  return await redis.lRange(key, 0, -1);
};
