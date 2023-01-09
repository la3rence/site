import { pushToList, getList } from "../../../lib/redis";

const FOLLOWERS_KEY = "ap:followers";

export default async function followers(req, res) {
  let origin = req.headers.host;
  origin = origin.includes("localhost")
    ? "http://" + origin
    : "https://" + origin;
  const followers = getList(FOLLOWERS_KEY);
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
  await pushToList(FOLLOWERS_KEY, [follower]);
}
