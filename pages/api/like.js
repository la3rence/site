import { getOrigin } from "../../lib/util";
import { getLikeForObjectId } from "./activitypub/like";
import { fetchAvatar } from "./activitypub/actor";

export default async function like(req, res) {
  const origin = getOrigin(req);
  const activityObject = `${origin}${req.query.id}`;
  const likes = await getLikeForObjectId(activityObject);
  await Promise.all(
    likes.map(async like => {
      like.avatar = await fetchAvatar(like.actor);
    }),
  );
  res.json(likes);
}
