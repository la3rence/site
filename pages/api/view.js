import { getCollection } from "../../lib/mongo";

// edge functions enable:
// export const config = {
//   runtime: "experimental-edge",
// };

export default async function view(req, res) {
  const page = req.query.page ? req.query.page : "/";
  const currentPageView = await recordPageView(page);
  res.json(currentPageView); // pageKey, view
}

export async function recordPageView(path) {
  const pageViews = await getCollection("pageViews");
  const filter = { path: path };
  const update = { $inc: { count: 1 } };
  const options = { upsert: true, returnOriginal: false };
  const result = await pageViews.findOneAndUpdate(filter, update, options);
  console.log(`Page view ${path}, Result: ${JSON.stringify(result.value)}`);
  return result.value; // {id, path, value}
}
