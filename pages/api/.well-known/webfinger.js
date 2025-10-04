import config from "../../../lib/config.mjs";
import { getOrigin } from "../../../lib/util";

export default async function webfinger(req, res) {
  res.setHeader("Content-Type", "application/jrd+json");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=60");
  const origin = getOrigin(req);
  const resource = req.query.resource;
  if (
    !resource ||
    resource != `acct:${config.activityPubUser}@${req.headers.host}` ||
    !config.enableActivityPub
  ) {
    res.statusCode = 404;
    res.end(`{"error": "unknown resource"}`);
    return;
  }
  res.statusCode = 200;
  res.end(`{
    "subject": "acct:${config.activityPubUser}@${req.headers.host}",
    "aliases": [],
    "links": [
      {
        "rel": "http://webfinger.net/rel/profile-page",
        "type": "text/html",
        "href": "${origin}/about"
      },
      {
        "rel": "self",
        "type": "application/activity+json",
        "href": "${origin}/api/activitypub/actor"
      }
    ]
  }`);
}
