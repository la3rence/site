import { getCollection } from "../../../lib/mongo";
import { fetchActorInformation, getFediAcctFromActor, fetchAvatar } from "./actor";
import { getOrigin } from "../../../lib/util";
import cache from "../../../lib/cache";
import config from "../../../lib/config.mjs";

const REPLY_COLLECTION = "reply";
let replyCollectionPromise;

const getReplyCollection = () => {
  if (!config.enableActivityPub) return null;
  replyCollectionPromise ||= getCollection(REPLY_COLLECTION);
  return replyCollectionPromise;
};

// msg example: https://toot.io/users/lawrence/statuses/109679255155820013/activity
export const saveReply = async msg => {
  if (msg.object.type === "Note") {
    const replyCollection = await getReplyCollection();
    if (!replyCollection) return;
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

export const getRepliesForObject = async inReplyTo => {
  const cachedReplies = cache.get(`activitypub:replies:${inReplyTo}`);
  if (cachedReplies) {
    return cachedReplies;
  }
  const query = {
    inReplyTo: inReplyTo,
  };
  const replyCollection = await getReplyCollection();
  if (!replyCollection) return [];
  const replies = await replyCollection.find(query).toArray();
  await Promise.all(
    replies.map(async reply => {
      reply.avatar = await fetchAvatar(reply.actor);
    }),
  );
  cache.set(`activitypub:replies:${inReplyTo}`, replies);
  return replies;
};

export default async function reply(req, res) {
  const origin = getOrigin(req);
  const inReplyTo = `${origin}${req.query.id}`;
  const replies = await getRepliesForObject(inReplyTo);
  res.json(replies);
}
