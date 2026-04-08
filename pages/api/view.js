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
    let page = req.query.page ? req.query.page : "/";
    // Ensure page is always a simple string to prevent NoSQL injection
    if (Array.isArray(page)) {
      page = page[0];
    }
    page = String(page);
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
