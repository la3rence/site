import { incrementKey, readKey } from "./../../lib/redis";

export default async function like(req, res) {
  const { method } = req;
  const page = req.query.page ? req.query.page : "/";
  const pageKey = "like:" + page;
  if (method === "GET") {
    const likeCount = await readKey(pageKey);
    res.json({ pageKey, likeCount });
  } else if (method === "POST") {
    const likeCount = await incrementKey(pageKey);
    console.log(`Someone likes the page ${page} (${likeCount})`);
    res.json({ pageKey, likeCount });
  } else {
    res.json({ pageKey, likeCount: 0 });
  }
}
