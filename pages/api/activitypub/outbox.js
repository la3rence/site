import { getMdPostsData } from "../../../lib/ssg.mjs";

export default async function outbox(req, res) {
  let origin = req.headers.host;
  origin = origin.includes("localhost")
    ? "http://" + origin
    : "https://" + origin;
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/activity+json");
  const posts = await getMdPostsData();
  const outbox = {
    "@context": "https://www.w3.org/ns/activitystreams",
    id: `${origin}/api/activitypub/outbox`,
    summary: "",
    type: "OrderedCollection",
    totalItems: posts.length,
    orderedItems: posts.map(post => generateNote(origin, post)),
  };
  res.json(outbox);
}

export const generateNote = (origin, post) => {
  return {
    "@context": ["https://www.w3.org/ns/activitystreams"],
    id: `${origin}/blog/${post.id}?id=${post.id}&v=1`,
    type: "Note",
    published: new Date(post.date).toUTCString(),
    attributedTo: `${origin}/api/activitypub/actor`,
    actor: `${origin}/api/activitypub/actor`,
    content: `<a href="${origin}/blog/${post.id}">${post.title}</a><br>${post.description}`,
    url: `${origin}/blog/${post.id}`,
    to: ["https://www.w3.org/ns/activitystreams#Public"],
    cc: [`${origin}/api/activitypub/followers`],
    // "replies": {
    //   "id": `${origin}/api/activitypub/reply/${post.id}`,
    //   "type": "Collection",
    //   "first": {
    //     "type": "CollectionPage",
    //     "next": "todo" + "?page=1",
    //     "partOf": "todo",
    //     "items": [],
    //   },
    // },
  };
};
