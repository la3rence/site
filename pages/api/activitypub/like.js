import { getCollection } from "../../../lib/mongo";
import cache from "../../../lib/cache";

const LIKES_COLLECTION = "likes";
const likesCollection = await getCollection(LIKES_COLLECTION);

export const saveLike = async message => {
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
  const queryObject = { object: objectId };
  const projectionObject = { actor: 1 };
  const result = await likesCollection.find(queryObject, projectionObject).toArray();
  cache.set(`activitypub:likes:${objectId}`, result);
  return result;
};
