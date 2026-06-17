import { getCollection } from "../../../lib/mongo";
import cache from "../../../lib/cache";
import config from "../../../lib/config.mjs";

const LIKES_COLLECTION = "likes";
let likesCollectionPromise;

const getLikesCollection = () => {
  if (!config.enableActivityPub) return null;
  likesCollectionPromise ||= getCollection(LIKES_COLLECTION);
  return likesCollectionPromise;
};

export const saveLike = async message => {
  const likesCollection = await getLikesCollection();
  if (!likesCollection) return;
  const like = {
    actor: message.actor,
    object: message.object,
    createdAt: new Date(),
  };
  await likesCollection.insertOne(like);
  cache.del(`activitypub:likes:${message.object}`);
  console.log(`like saved: ${JSON.stringify(like)}`);
};

// object: actually the blog url
export const getLikeForObjectId = async objectId => {
  // cache
  const cachedLikes = cache.get(`activitypub:likes:${objectId}`);
  if (cachedLikes) {
    return cachedLikes;
  }
  const likesCollection = await getLikesCollection();
  if (!likesCollection) return [];
  const queryObject = { object: objectId };
  const projectionObject = { actor: 1 };
  const result = await likesCollection.find(queryObject, projectionObject).toArray();
  cache.set(`activitypub:likes:${objectId}`, result);
  return result;
};
