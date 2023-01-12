import { generateNote } from "./outbox";
import { getMdContentById } from "../../../lib/ssg.mjs";
import { getOrigin, sendSignedRequest } from "../../../lib/util";

export default async function publish(req, res) {
  const origin = getOrigin(req);
  const id = req.query.id;
  if (!id) {
    res.json({ error: "missing id" });
  }
  const post = await getMdContentById(id);
  const createMessage = {
    "@context": "https://www.w3.org/ns/activitystreams",
    id: `${origin}/api/activitypub/blog/${post.id}?create=true`,
    type: "Create",
    actor: `${origin}/api/activitypub/actor`,
    to: ["https://www.w3.org/ns/activitystreams#Public"],
    cc: [`${origin}/api/activitypub/followers`],
    object: generateNote(origin, post),
  };
  console.log("message", createMessage);
  const response = await sendSignedRequest(
    `${origin}/api/activitypub/actor#main-key`,
    new URL("https://mstdn.social/inbox"),
    createMessage
  );
  const text = await response.text();
  console.log("Following result", response.status, response.statusText, text);
  res.json({ ...response, ...createMessage });
}
