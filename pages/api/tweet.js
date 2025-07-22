import { getTweet } from "react-tweet/api";
import cache from "../../lib/cache";

export default async function tweet(req, res) {
  const id = req.query.id;
  const cachedTweet = cache.get(`tweet:${id}`);
  if (cachedTweet) {
    return res.json({ data: cachedTweet });
  }

  const tweet = await getTweet(id);
  cache.set(`tweet:${id}`, tweet);
  res.json({ data: tweet });
}
