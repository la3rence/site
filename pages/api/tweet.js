import { getTweet } from "react-tweet/api";

export default async function tweet(req, res) {
  const id = req.query.id;
  const tweet = await getTweet(id);
  res.json({ data: tweet });
}
