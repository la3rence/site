import WorkersKVREST from "@sagi.io/workers-kv";
import env from "./../../lib/env";
const { CF_ACCOUNT_ID, CF_AUTH_KV_TOKEN, CF_EMAIL, CF_NAMESPACE_ID } = env;

const workersKV = new WorkersKVREST({
  cfAccountId: CF_ACCOUNT_ID,
  cfAuthToken: CF_AUTH_KV_TOKEN,
  cfEmail: CF_EMAIL,
});

export default async function view(req, res) {
  const page = req.query.page ? req.query.page : "/";
  const currentPageView = await viewPage(page);
  res.json(currentPageView);
}

const viewPage = async page => {
  const res = await addPageView(page);
  return res;
};

const addPageView = async page => {
  const currentPageView = await getPageViewCount(page);
  const view = currentPageView + 1;
  console.log(`page: ${page} count: ${view}`);
  const writeResult = await writeKeyValue(page, view);
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