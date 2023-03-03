import { getCollection } from "../../../lib/mongo";

const LIKES_COLLECTION = "likes";

export const saveLike = async message => {
  const likesCollection = await getCollection(LIKES_COLLECTION);
  const like = {
    actor: message.actor.id,
    object: message.object.id,
    createdAt: new Date(),
  };
  await likesCollection.insertOne(like);
  console.log(`like saved: ${JSON.parse(like)}`);
};

// object: actually the blog url
export const getLikeForObjectId = async objectId => {
  const likesCollection = await getCollection(LIKES_COLLECTION);
  const likes = await likesCollection
    .aggregate([
      { $match: { object: objectId } },
      {
        $lookup: {
          from: "users",
          localField: "actor",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $group: {
          _id: "$actor",
          users: { $push: "$user" },
        },
      },
    ])
    .toArray();

  return likes.map(like => ({
    actor: like._id,
    users: like.users.flat(),
  }));
};
