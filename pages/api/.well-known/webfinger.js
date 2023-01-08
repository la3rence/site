const apAccountName = "acct:lawrence@mstdn.social";

export default async function webfinger(req, res) {
  let origin = req.headers.host;
  origin = origin.includes("localhost")
    ? "http://" + origin
    : "https://" + origin;
  res.statusCode = 200;
  res.setHeader("Content-Type", `application/jrd+json`);
  res.end(`{  
    "subject": "${apAccountName}",
    "aliases": [],
    "links": [
      {
        "rel": "self",
        "type": "application/activity+json",
        "href": "${origin}/api/activitypub/actor"
      }
    ]
  }`);
}
