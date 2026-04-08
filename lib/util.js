import { Sha256Signer } from "./signature";
import { createHash } from "crypto";
import { IS_PROD } from "./env.js";

export const getOrigin = req => {
  const origin = req.headers.host;
  if (IS_PROD) {
    return `https://${origin}`;
  }
  return origin.includes("localhost") ? "http://" + origin : "https://" + origin;
};

export const respondActivityJSON = (res, json) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/activity+json");
  res.end(JSON.stringify(json));
};

function isPrivateOrLoopbackIp(hostname) {
  const ipv4Regex = /^(?:\d{1,3}\.){3}\d{1,3}$/;
  if (!ipv4Regex.test(hostname)) {
    return false;
  }
  const parts = hostname.split(".").map(x => parseInt(x, 10));
  if (parts.some(octet => Number.isNaN(octet) || octet < 0 || octet > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 10) {
    return true;
  }
  if (a === 172 && b >= 16 && b <= 31) {
    return true;
  }
  if (a === 192 && b === 168) {
    return true;
  }
  if (a === 127) {
    return true;
  }
  if (a === 169 && b === 254) {
    return true;
  }
  return false;
}

function isSafeEndpoint(endpoint) {
  const protocol = endpoint.protocol;
  if (protocol !== "http:" && protocol !== "https:") {
    return false;
  }
  const hostname = endpoint.hostname.toLowerCase();
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
    return false;
  }
  if (hostname.endsWith(".local")) {
    return false;
  }
  if (isPrivateOrLoopbackIp(hostname)) {
    return false;
  }
  return true;
}

export async function sendSignedRequest(publicKeyId, endpoint, object) {
  if (!isSafeEndpoint(endpoint)) {
    throw new Error("Refusing to send request to unsafe endpoint");
  }
  const privateKey = process.env.ACTIVITYPUB_PRIVATE_KEY;
  const signer = new Sha256Signer({
    publicKeyId,
    privateKey,
    headerNames: ["host", "date", "digest"],
  });

  const requestHeaders = {
    host: endpoint.hostname,
    date: new Date().toUTCString(),
    digest: `SHA-256=${createHash("sha256").update(JSON.stringify(object)).digest("base64")}`,
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
