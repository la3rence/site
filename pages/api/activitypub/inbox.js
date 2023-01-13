import { saveFollower } from "./followers";
import { v4 as uuidv4 } from "uuid";
import { getOrigin, sendSignedRequest } from "../../../lib/util.js";
import { saveReply } from "./reply";

export default async function inbox(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 404;
    res.end("method not allowed");
    return;
  }
  const origin = getOrigin(req);
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/activity+json");
  // todo: verify signature
  const requestBody = req.body;
  const message = JSON.parse(requestBody);
  console.log("inbox msg", message);
  if (message.actor != null) {
    console.log("actor info to save: ", message.actor);
    // todo: await saveActor(actorInformation);
    // Add the actor information to the message so that it's saved directly.
  }
  if (message.type == "Follow" && message.actor != null) {
    console.log("follower to accept & save");
    // Accept & save to my own db
    await sendAcceptMessage(message, origin);
    await saveFollower(message.actor);
  }
  if (message.type == "Like") {
    console.log("like to save");
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
    console.log("Undo to update");
  }
  if (message.type == "Update") {
    // TODO: We need to update the messages
    console.log("Update message", message);
  }
  res.end("ok");
}

async function sendAcceptMessage(body, originDomain) {
  const message = {
    "@context": "https://www.w3.org/ns/activitystreams",
    id: `${originDomain}}/${uuidv4()}`,
    type: "Accept",
    actor: `${originDomain}/api/activitypub/actor`,
    object: body,
  };
  await sendSignedRequest(
    `${originDomain}/api/activitypub/actor#main-key`,
    new URL(body.actor + "/inbox"),
    message
  );
}
