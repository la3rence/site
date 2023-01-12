import { getOrigin, respondActivityJSON } from "../../../../lib/util.js";
import { getMdContentById } from "../../../../lib/ssg.mjs";
import { generateNote } from "../outbox.js";

export default async function Blog(req, res) {
  const origin = getOrigin(req);
  // console.log("headers", req.headers); //debug only
  const { id } = req.query;
  const post = await getMdContentById(id);
  const note = generateNote(origin, post);
  respondActivityJSON(res, note);
}
