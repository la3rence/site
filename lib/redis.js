import env from "./../lib/env";
import { createClient } from "redis";

let redis;

export const connectRedis = async () => {
  const redisClient = createClient({
    url: env.REDIS_CONNECTION,
    socket: {
      timeout: 3000,
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
    console.log("Reuse redis connection.");
    return redis;
  } else {
    console.log("Connect To Redis...");
    return await connectRedis();
  }
};

export const disconnect = async () => {
  await redis.disconnect();
};

// ----- Redis SDK -----
export const readKey = async key => {
  const redis = await getRedisClient();
  return await redis.get(key);
};

export const writeKeyValue = async (key, value) => {
  const redis = await getRedisClient();
  await redis.set(key, value);
};

export const incrementKey = async key => {
  const redis = await getRedisClient();
  return await redis.incr(key);
};
