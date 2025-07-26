import { getCollection } from "../../../lib/mongo";
import { fetchActorInformation, getFediAcctFromActor, fetchAvatar } from "./actor";
import { getOrigin } from "../../../lib/util";
import cache from "../../../lib/cache";

const REPLY_COLLECTION = "reply";
const replyCollection = await getCollection(REPLY_COLLECTION);

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
    const inserted = await replyCollection.insertOne({
      inReplyTo,
      actor,
      published,
      url,
      content,
      account,
    });
    // purge cache
    cache.del(`activitypub:replies:${inReplyTo}`);
    console.log("Inserted reply: ", inserted);
  }
};

export default async function reply(req, res) {
  const origin = getOrigin(req);
  const inReplyTo = `${origin}${req.query.id}`;
  const cachedReplies = cache.get(`activitypub:replies:${inReplyTo}`);
  if (cachedReplies) {
    res.json(cachedReplies);
    return;
  }
  const query = {
    inReplyTo: inReplyTo,
  };
  const replies = await replyCollection.find(query).toArray();
  await Promise.all(
    replies.map(async reply => {
      reply.avatar = await fetchAvatar(reply.actor);
    }),
  );
  cache.set(`activitypub:replies:${inReplyTo}`, replies);
  res.json(replies);
}
