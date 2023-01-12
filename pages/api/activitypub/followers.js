import { pushToList, getList } from "../../../lib/redis";
import { getOrigin, respondActivityJSON } from "../../../lib/util";

const FOLLOWERS_KEY = "ap:followers";

export default async function followers(req, res) {
  const origin = getOrigin(req);
  const followers = await getAllFollowers();
  const response = {
    "@context": "https://www.w3.org/ns/activitystreams",
    id: `${origin}/api/activitypub/followers`,
    type: "OrderedCollection",
    totalItems: followers.length,
    orderedItems: followers,
  };
  respondActivityJSON(res, response);
}

export async function saveFollower(follower) {
  const followers = await getList(follower);
  if (!followers.includes(follower)) {
    await pushToList(FOLLOWERS_KEY, [follower]);
  }
}

export async function getAllFollowers() {
  return await getList(FOLLOWERS_KEY);
}
