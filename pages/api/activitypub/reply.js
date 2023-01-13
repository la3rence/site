import { insertOne, findByField } from "../../../lib/mongo";
import { fetchActorInformation, getFediAcctFromActor } from "./actor";
import config from "../../../lib/config.mjs";

const REPLY_COLLECTION = "reply";

// msg example: https://toot.io/users/lawrence/statuses/109679255155820013/activity
export const saveReply = async msg => {
  if (msg.object.type === "Note") {
    const inReployTo = msg.object.inReplyTo; // blog id
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
      inReployTo,
      actor,
      published,
      url,
      content,
      account,
    });
    console.log("inserted reply: ", inserted);
  }
};

export default async function reply(req, res) {
  const query = {
    inReplyTo: `${config.baseURL}${req.query.id}`,
  };
  console.log(query);
  const replies = await findByField(REPLY_COLLECTION, query);
  res.json(replies);
}
