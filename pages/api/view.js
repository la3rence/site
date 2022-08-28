import WorkersKVREST from "@sagi.io/workers-kv";
import env from "./../../lib/env";
const { CF_ACCOUNT_ID, CF_AUTH_KV_TOKEN, CF_EMAIL, CF_NAMESPACE_ID } = env;

const workersKV = new WorkersKVREST({
  cfAccountId: CF_ACCOUNT_ID,
  cfAuthToken: CF_AUTH_KV_TOKEN,
  cfEmail: CF_EMAIL,
});

// https://dash.cloudflare.com/f193bb9e16174232d8d83952d0cf64b8/workers/kv/namespaces/620b0d26c548437a86a761036ce2c656
export default async function view(req, res) {
  let page = req.query.page ? req.query.page : "/";
  const currentPageView = await viewPage(page);
  res.json(currentPageView);
}

const viewPage = async page => {
  await addPageView(page);
  const allPageViews = await getAllPageViews();
  const thisPageView = allPageViews.filter(item => {
    return item.page === page;
  });
  return thisPageView[0];
};

const addPageView = async page => {
  const currentPageView = await getPageViewCount(page);
  console.log(`page ${page} count: ${currentPageView}`);
  const added = await writeKeyValue(page, currentPageView + 1);
  return added;
};

const getAllPageViews = async () => {
  const { result } = await workersKV.listAllKeys({
    namespaceId: CF_NAMESPACE_ID,
  });
  const viewMapping = await Promise.all(
    result.map(async item => {
      const viewCountByName = await getPageViewCount(item.name);
      return { page: item.name, view: viewCountByName };
    })
  );
  return viewMapping;
};

const getPageViewCount = async page => {
  const readResult = await readKey(page);
  if (readResult.error || readResult.errors) {
    return 0; // first time loading
  }
  return Number(readResult); // direct value with Number type
};

// ----- Workers KV API -----
// the `key` require URL encoded
const readKey = async key => {
  const readResult = await workersKV.readKey({
    key: encodeURIComponent(key),
    namespaceId: CF_NAMESPACE_ID,
  });
  return readResult;
};

const writeKeyValue = async (key, value) => {
  const objToWrite = {
    key: encodeURIComponent(key),
    value: `${value}`,
    namespaceId: CF_NAMESPACE_ID,
  };
  const writeResult = await workersKV.writeKey(objToWrite);
  return writeResult;
};
