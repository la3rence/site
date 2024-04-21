import { getOrigin, respondActivityJSON } from "../../../lib/util";
import { getCollection } from "../../../lib/mongo";
import { IS_PROD } from "../../../lib/env";

const FOLLOWERS_COLLECTION = "followers";
const followersCollection = await getCollection(FOLLOWERS_COLLECTION);

export default async function followers(req, res) {
  const origin = getOrigin(req);
  const followers = await getAllFollowers();
  const response = {
    "@context": "https://www.w3.org/ns/activitystreams",
    id: `${origin}/api/activitypub/followers`,
    type: "OrderedCollection",
    totalItems: IS_PROD ? followers.length : 0,
    orderedItems: IS_PROD ? followers : [],
  };
  respondActivityJSON(res, response);
}

export async function saveFollower(follower) {
  const data = await followersCollection.findOne();
  let orderedItems = [];
  if (data) {
    orderedItems = data.orderedItems;
    if (orderedItems.includes(follower)) {
      console.log(`follower ${follower} already exists`);
      return;
    }
  }
  orderedItems.push(follower);
  const result = await followersCollection.replaceOne({}, { orderedItems }, { upsert: true });
  console.log(result.upsertedCount > 0 ? "Inserted new follower" : "Updated existing follower");
}

export async function removeFollower(follower) {
  const data = await followersCollection.findOne();
  let orderedItems = [];
  if (data) {
    orderedItems = data.orderedItems;
    const index = orderedItems.indexOf(follower);
    if (index !== -1) {
      orderedItems.splice(index, 1);
      await followersCollection.updateOne({}, { $set: { orderedItems } });
      console.log(`follower ${follower} removed successfully`);
      return;
    }
  }
  console.log(`follower ${follower} not found`);
}

export async function getAllFollowers() {
  const data = await followersCollection.findOne();
  if (data) {
    return data.orderedItems;
  }
  return [];
}
