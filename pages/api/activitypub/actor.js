import config from "../../../lib/config.mjs";
import { getOrigin, respondActivityJSON } from "../../../lib/util.js";

export const getFediAcctFromActor = (username, actor) => {
  const actorURL = new URL(actor);
  const domain = actorURL.hostname;
  return `@${username}@${domain}`;
};

export async function fetchActorInformation(actorUrl) {
  // console.log("Fetching actor from: ", actorUrl);
  try {
    const response = await fetch(actorUrl, {
      headers: {
        "Content-Type": "application/activity+json",
        Accept: "application/activity+json",
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Unable to fetch action information", actorUrl);
  }
  return null;
}

export const fetchAvatar = async actor => {
  const actorInfo = await fetchActorInformation(actor);
  if (actorInfo?.icon?.url) {
    return actorInfo.icon.url;
  } else {
    return "https://mastodon.social/avatars/original/missing.png";
  }
};

export default async function actor(req, res) {
  const origin = getOrigin(req);
  respondActivityJSON(res, {
    "@context": ["https://www.w3.org/ns/activitystreams", "https://w3id.org/security/v1"],
    id: `${origin}/api/activitypub/actor`,
    type: "Person",
    name: config.siteTitle,
    preferredUsername: config.activityPubUser,
    summary: config.siteDescription,
    inbox: `${origin}/api/activitypub/inbox`,
    outbox: `${origin}/api/activitypub/outbox`,
    followers: `${origin}/api/activitypub/followers`,
    // following: `${origin}/api/activitypub/following`,
    icon: {
      type: "Image",
      mediaType: "image/png",
      url: `${origin}/icon.png`,
    },
    publicKey: {
      id: `${origin}/api/activitypub/actor#main-key`,
      owner: `${origin}/api/activitypub/actor`,
      publicKeyPem: process.env.ACTIVITYPUB_PUBLIC_KEY,
    },
  });
}
