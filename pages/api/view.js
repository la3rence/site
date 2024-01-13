import { getCollection } from "../../lib/mongo";
import { getAllPostsId } from "../../lib/ssg.mjs";
import { IS_PROD } from "../../lib/env";

// edge functions enable:
// export const config = {
//   runtime: "experimental-edge",
// };

export default async function view(req, res) {
  if (IS_PROD) {
    const page = req.query.page ? req.query.page : "/";
    const currentPageView = await recordPageView(page);
    res.json(currentPageView); // pageKey, view
    return;
  }
  res.json({});
}

export async function checkPathExists(path) {
  const postPaths = (await getAllPostsId()).map(id => `/blog/${id}`);
  return postPaths.includes(path);
}

export async function recordPageView(path) {
  if (!(await checkPathExists(path))) {
    return {};
  }
  const filter = { path: path };
  const pageViews = await getCollection("pageViews");
  const update = { $inc: { count: 1 } };
  const options = { upsert: true, returnOriginal: false };
  const result = await pageViews.findOneAndUpdate(filter, update, options);
  console.log(`Mongo Page View ${JSON.stringify(result)}`);
  return result; // {id, path, count}
}
