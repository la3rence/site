import { getCollection } from "../../../lib/mongo";

const LIKES_COLLECTION = "likes";

export const saveLike = async message => {
  const likesCollection = await getCollection(LIKES_COLLECTION);
  const like = {
    actor: message.actor,
    object: message.object,
    createdAt: new Date(),
  };
  await likesCollection.insertOne(like);
  console.log(`like saved: ${JSON.stringify(like)}`);
};

// object: actually the blog url
export const getLikeForObjectId = async objectId => {
  const likesCollection = await getCollection(LIKES_COLLECTION);
  const queryObject = { object: objectId };
  const projectionObject = { actor: 1 };
  const result = await likesCollection
    .find(queryObject, projectionObject)
    .toArray();
  console.log(result);
  return result;
};
