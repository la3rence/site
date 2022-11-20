import env from "./../lib/env";
import { createClient } from "redis";

let redis;

export const connectRedis = async () => {
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
    console.log("Connect To Redis...");
    return await connectRedis();
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
