import { Sha256Signer } from "./signature";
import { createHash } from "crypto";

export const swrConfig = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

export const fetcher = async (...args) => {
  // sleep 500ms because I like to see the skeleton
  await new Promise(x => setTimeout(x, 500));
  const res = await fetch(...args);
  if (!res.ok) {
    // weird, error uncaught when use with suspense enabled
    return Promise.reject(res);
  }
  return res.json();
};

export const getOrigin = req => {
  let origin = req.headers.host;
  origin = origin.includes("localhost")
    ? "http://" + origin
    : "https://" + origin;
  return origin;
};

export const respondActivityJSON = (res, json) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/activity+json");
  res.end(JSON.stringify(json));
};

export async function sendSignedRequest(publicKeyId, endpoint, object) {
  const privateKey = process.env.ACTIVITYPUB_PRIVATE_KEY;
  const signer = new Sha256Signer({
    publicKeyId,
    privateKey,
    headerNames: ["host", "date", "digest"],
  });

  const requestHeaders = {
    host: endpoint.hostname,
    date: new Date().toUTCString(),
    digest: `SHA-256=${createHash("sha256")
      .update(JSON.stringify(object))
      .digest("base64")}`,
  };

  const signature = signer.sign({
    url: endpoint,
    method: "POST",
    headers: requestHeaders,
  });

  const response = await fetch(endpoint, {
    method: "POST",
    body: JSON.stringify(object),
    headers: {
      "content-type": "application/activity+json",
      accept: "application/activity+json",
      ...requestHeaders,
      signature: signature,
    },
  });
  return response;
}
