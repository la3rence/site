import { generateNote } from "./outbox";
import { getMdContentById } from "../../../lib/ssg.mjs";
import { sendSignedRequest } from "../../../lib/httpSign.mjs";
import { getAllFollowers } from "./followers";
// import { v4 as uuidv4 } from "uuid";

export default async function publish(req, res) {
  let origin = req.headers.host;
  origin = origin.includes("localhost")
    ? "http://" + origin
    : "https://" + origin;
  const id = req.query.id;
  if (!id) {
    res.json({ error: "missing id" });
  }
  const post = await getMdContentById(id);

  const createMessage = {
    "@context": "https://www.w3.org/ns/activitystreams",
    id: `${origin}/blog/${post.id}?create=true&id=${post.id}&v=1`,
    type: "Create",
    actor: `${origin}/api/activitypub/actor`,
    to: ["https://www.w3.org/ns/activitystreams#Public"],
    cc: await getAllFollowers(),
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
  res.end(text);
}
