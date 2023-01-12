import { getMdPostsData } from "../../../lib/ssg.mjs";
import { getOrigin, respondActivityJSON } from "../../../lib/util.js";
import config from "../../../lib/config.mjs";

export default async function outbox(req, res) {
  const origin = getOrigin(req);
  const posts = await getMdPostsData();
  const outbox = {
    "@context": "https://www.w3.org/ns/activitystreams",
    id: `${origin}/api/activitypub/outbox`,
    summary: config.siteDescription,
    type: "OrderedCollection",
    totalItems: posts.length,
    orderedItems: posts.map(post => generateNote(origin, post)),
  };
  respondActivityJSON(res, outbox);
}

export const generateNote = (origin, post) => {
  return {
    "@context": ["https://www.w3.org/ns/activitystreams"],
    id: `${origin}/api/activitypub/blog/${post.id}`,
    type: "Note",
    published: new Date(post.date).toUTCString(),
    attributedTo: `${origin}/api/activitypub/actor`,
    // actor: `${origin}/api/activitypub/actor`,
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
