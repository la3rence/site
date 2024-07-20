import { getOrigin, respondActivityJSON } from "../../../../lib/util.js";
import { getMdContentById } from "../../../../lib/ssg.mjs";
import { generateNote } from "../outbox.js";
import config from "../../../../lib/config.mjs";

export default async function Blog(req, res) {
  const origin = getOrigin(req);
  const { id } = req.query;
  let post = await getMdContentById(id);
  if (!post) {
    post = await getMdContentById(`${id}.${config.defaultLocale}`);
  }
  const note = generateNote(origin, post);
  respondActivityJSON(res, note);
}
