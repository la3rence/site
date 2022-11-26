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
      return { get: () => 1, set: () => {}, incr: n => 2 };
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
  // await disconnect();
  return value;
};

export const writeKeyValue = async (key, value) => {
  const redis = await getRedisClient();
  await redis.set(key, value);
  // await disconnect();
};

export const incrementKey = async key => {
  const redis = await getRedisClient();
  const value = await redis.incr(key);
  // await disconnect();
  return value;
};
