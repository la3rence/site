import { searchByKeyword } from "../../lib/ssg.mjs";

export default async function search(req, res) {
  if (req.query.q) {
    const results = await searchByKeyword(req.query.q);
    res.json(results);
  } else {
    res.json([]);
  }
}
