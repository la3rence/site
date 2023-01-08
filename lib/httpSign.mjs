import { Sha256Signer } from "./signature";
import { createHash } from "crypto";

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

  // Generate the signature header
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
