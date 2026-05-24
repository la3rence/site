import { removeFollower, saveFollower } from "./followers";
import { v4 as uuidv4 } from "uuid";
import { getOrigin, sendSignedRequest } from "../../../lib/util.js";
import { saveReply } from "./reply";
import { saveLike } from "./like";

export default async function inbox(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end("method not allowed");
    return;
  }
  const origin = getOrigin(req);
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/activity+json");
  // todo: verify signature
  const requestBody = req.body;
  const message = JSON.parse(requestBody);
  if (message.type == "Delete") {
    res.end("ok");
    return;
  }
  console.log("inbox msg", message);
  // if (message.actor != null) {
  //   // console.log("actor info to save: ", message.actor);
  //   // todo: await saveActor(actorInformation);
  //   // Add the actor information to the message so that it's saved directly.
  // }
  if (message.type == "Follow" && message.actor != null) {
    console.log("follower to accept & save");
    // Accept & save to my own db
    await sendAcceptMessage(message, origin);
    await saveFollower(message.actor);
  }
  if (message.type == "Like") {
    await saveLike(message);
  }
  if (message.type == "Announce") {
    console.log("announce to save");
  }
  if (message.type == "Create") {
    // Someone is sending us a message
    console.log("Incoming Message To Create");
    await saveReply(message);
  }
  if (message.type == "Undo") {
    // undo also has different types
    console.log("Undo Action Triggered");
    if (message.object.type === "Follow") {
      await removeFollower(message.actor);
    }
  }
  if (message.type == "Update") {
    // TODO: We need to update the messages
    console.log("Update message", message);
  }
  res.end("ok");
}

async function sendAcceptMessage(body, originDomain) {
  if (typeof body?.actor !== "string") {
    throw new Error("Invalid actor");
  }

  let actorUrl;
  try {
    actorUrl = new URL(body.actor);
  } catch {
    throw new Error("Invalid actor URL");
  }

  if (actorUrl.protocol !== "http:" && actorUrl.protocol !== "https:") {
    throw new Error("Unsupported actor URL protocol");
  }
  if (actorUrl.username || actorUrl.password || actorUrl.search || actorUrl.hash) {
    throw new Error("Invalid actor URL format");
  }

  const hostname = actorUrl.hostname.toLowerCase();
  const ipv4Regex = /^(?:\d{1,3}\.){3}\d{1,3}$/;
  const isPrivateOrLoopbackIpv4 = (() => {
    if (!ipv4Regex.test(hostname)) return false;
    const parts = hostname.split(".").map(x => parseInt(x, 10));
    if (parts.some(octet => Number.isNaN(octet) || octet < 0 || octet > 255)) return true;
    const [a, b] = parts;
    return (
      a === 10 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a === 127 ||
      (a === 169 && b === 254)
    );
  })();

  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".local") ||
    isPrivateOrLoopbackIpv4
  ) {
    throw new Error("Refusing to send request to unsafe actor host");
  }

  const inboxUrl = new URL("/inbox", actorUrl.origin);

  const message = {
    "@context": "https://www.w3.org/ns/activitystreams",
    id: `${originDomain}/api/activity/accept/${uuidv4()}`,
    type: "Accept",
    actor: `${originDomain}/api/activitypub/actor`,
    object: body,
  };
  await sendSignedRequest(
    `${originDomain}/api/activitypub/actor#main-key`,
    inboxUrl,
    message,
  );
}
