import { pushToList, getList } from "../../../lib/redis";

const FOLLOWERS_KEY = "ap:followers";

export default async function followers(req, res) {
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/activity+json");
  let origin = req.headers.host;
  origin = origin.includes("localhost")
    ? "http://" + origin
    : "https://" + origin;
  const followers = await getAllFollowers();
  const response = {
    "@context": "https://www.w3.org/ns/activitystreams",
    id: `${origin}/api/activitypub/followers`,
    type: "OrderedCollection",
    totalItems: followers.length,
    orderedItems: followers,
  };
  res.json(response);
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
