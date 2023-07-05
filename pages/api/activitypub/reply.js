import { insertOne, findByField } from "../../../lib/mongo";
import {
  fetchActorInformation,
  getFediAcctFromActor,
  fetchAvatar,
} from "./actor";
import { getOrigin } from "../../../lib/util";

const REPLY_COLLECTION = "reply";

// msg example: https://toot.io/users/lawrence/statuses/109679255155820013/activity
export const saveReply = async msg => {
  if (msg.object.type === "Note") {
    const inReplyTo = msg.object.inReplyTo; // blog id
    const actor = msg.actor; // who replied.
    const published = msg.published;
    const url = msg.object.url; // origin reply url
    const content = msg.object.content; // need clean up
    // get account name from actor
    const actorInfo = await fetchActorInformation(actor);
    const username = actorInfo.preferredUsername;
    const account = getFediAcctFromActor(username, actor);
    // save to db
    const inserted = await insertOne(REPLY_COLLECTION, {
      inReplyTo,
      actor,
      published,
      url,
      content,
      account,
    });
    console.log("Inserted reply: ", inserted);
  }
};

export default async function reply(req, res) {
  const origin = getOrigin(req);
  const query = {
    inReplyTo: `${origin}${req.query.id}`,
  };
  const replies = await findByField(REPLY_COLLECTION, query);
  await Promise.all(
    replies.map(async reply => {
      reply.avatar = await fetchAvatar(reply.actor);
    }),
  );
  res.json(replies);
}
