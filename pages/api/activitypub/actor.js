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
    preferredUsername: "lawrence",
    name: "Lawrence Li",
    summary: "This is summary.",
    icon: [`${origin}/images/author/Lawrence.png`],
    publicKey: {
      "@context": "https://w3id.org/security/v1",
      "@type": "Key",
      id: `${origin}/api/activitypub/actor#main-key`,
      owner: `${origin}/api/activitypub/actor`,
      publicKeyPem: process.env.ACTIVITYPUB_PUBLIC_KEY,
    },
  });
}
