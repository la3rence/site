import {
  authorName,
  siteTitle,
  baseURL,
  siteDescription,
} from "./../../../lib/config.mjs";

export default async function actor(req, res) {
  let origin = req.headers.host;
  origin = origin.includes("localhost")
    ? "http://" + origin
    : "https://" + origin;
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/activity+json");
  res.json({
    "@context": ["https://www.w3.org/ns/activitystreams"],
    type: "Person",
    id: `${origin}/api/activitypub/actor`,
    outbox: `${origin}/api/activitypub/outbox`,
    following: `${origin}/api/activitypub/following`,
    followers: `${origin}/api/activitypub/followers`,
    inbox: `${origin}/api/activitypub/inbox`,
    preferredUsername: `${authorName}`,
    name: siteTitle,
    summary: `${siteDescription}`,
    icon: [`${origin}/images/author/${authorName}.png`],
    publicKey: {
      "@context": "https://w3id.org/security/v1",
      "@type": "Key",
      id: `${origin}/api/activitypub/actor#main-key`,
      owner: `${origin}/api/activitypub/actor`,
      publicKeyPem: process.env.ACTIVITYPUB_PUBLIC_KEY,
    },
  });
}
