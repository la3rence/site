import WorkersKVREST from "@sagi.io/workers-kv";
import env from "./../../lib/env";

const {
  CF_ACCOUNT_ID,
  CF_AUTH_KV_TOKEN,
  CF_EMAIL,
  CF_NAMESPACE_ID,
  VERCEL_ENV,
} = env;

const workersKV = new WorkersKVREST({
  cfAccountId: CF_ACCOUNT_ID,
  cfAuthToken: CF_AUTH_KV_TOKEN,
  cfEmail: CF_EMAIL,
});

const isProd = VERCEL_ENV === "production";

export default async function view(req, res) {
  const page = req.query.page ? req.query.page : "/";
  const currentPageView = await viewPage(page);
  res.json(currentPageView);
}

const viewPage = async page => {
  return await addPageView(page);
};

const addPageView = async page => {
  const currentPageView = await getPageViewCount(page);
  const view = currentPageView + 1;
  console.log(`page: ${page} count: ${view} write enabled: ${isProd}`);
  let writeResult;
  if (isProd) {
    // increment only in production
    writeResult = await writeKeyValue(page, view);
  }
  return {
    page,
    view,
    writeResult,
  };
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
  return await workersKV.readKey({
    key: encodeURIComponent(key),
    namespaceId: CF_NAMESPACE_ID,
  });
};

const writeKeyValue = async (key, value) => {
  const objToWrite = {
    key: encodeURIComponent(key),
    value: `${value}`,
    namespaceId: CF_NAMESPACE_ID,
  };
  return await workersKV.writeKey(objToWrite);
};
