import { getOrigin } from "../../../lib/util";
import { getLikeForObjectId } from "./activitypub/like";

export default async function like(req, res) {
  const origin = getOrigin(req);
  const activityObject = `${origin}${req.query.id}`;
  const likes = await getLikeForObjectId(activityObject);
  res.json(likes);
}
