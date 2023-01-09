import parser, { verifySignature } from "../../../lib/signature";
import { fetchActorInformation } from "./actor";

function parseSignature(request) {
  const { url, method, headers } = request;
  return parser.parse({ url, method, headers });
}

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function inbox(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 404;
    res.end("method not allowed");
    return;
  }
  console.log('inbox incoming req body', req.body);
  // verify signature
  const buf = await buffer(req);
  const rawBody = buf.toString("utf8");
  console.log("rawBody", rawBody);
  const message = JSON.parse(rawBody);
  console.log("inbox msg", message);
  const signature = parseSignature(req);
  const actorInformation = await fetchActorInformation(signature.keyId);
  const signatureValid = verifySignature(signature, actorInformation.publicKey);
  if (signatureValid == null || signatureValid == false) {
    res.statusCode = 401;
    res.end("invalid signature");
    return;
  }
  if (actorInformation != null) {
    console.log("actor info to save: ", actorInformation);
    // todo: await saveActor(actorInformation);
    // Add the actor information to the message so that it's saved directly.
    message.actor = actorInformation;
  }
  console.log("msg type", message.type);
  if (message.type == "Follow" && actorInformation != null) {
    // We are following.
    console.log("following to save");
    // await saveFollow(message, actorInformation);
  }
  if (message.type == "Like") {
    console.log("like to save");
  }
  if (message.type == "Announce") {
    console.log("announce to save");
  }
  if (message.type == "Create") {
    // Someone is sending us a message
    console.log("Message type Create");
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
