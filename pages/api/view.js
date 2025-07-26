import { getCollection } from "../../lib/mongo";
import { IS_PROD } from "../../lib/env";
import cache from "../../lib/cache";

// export const config = {
//   runtime: "experimental-edge",
// };

const pageViews = await getCollection("pageViews");

export default async function view(req, res) {
  console.log("cache stats", cache.getStats());
  if (IS_PROD) {
    const page = req.query.page ? req.query.page : "/";
    const currentPageView = await recordPageView(page);
    res.json(currentPageView); // pageKey, view
    return;
  }
  res.json({});
}

export async function recordPageView(path) {
  const filter = { path: path };
  const update = { $inc: { count: 1 } };
  const options = { upsert: true, returnOriginal: false };
  const result = await pageViews.findOneAndUpdate(filter, update, options);
  console.debug(`Mongo Page View ${JSON.stringify(result)}`);
  return result; // {id, path, count}
}
