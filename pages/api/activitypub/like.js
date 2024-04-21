import { getCollection } from "../../../lib/mongo";

const LIKES_COLLECTION = "likes";
const likesCollection = await getCollection(LIKES_COLLECTION);

export const saveLike = async message => {
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
  const queryObject = { object: objectId };
  const projectionObject = { actor: 1 };
  const result = await likesCollection.find(queryObject, projectionObject).toArray();
  return result;
};
