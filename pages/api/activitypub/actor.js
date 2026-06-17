import config from "../../../lib/config.mjs";
import {
  fetchActivityPubJson,
  getOrigin,
  parseSafeExternalUrl,
  respondActivityJSON,
} from "../../../lib/util.js";
import cache from "../../../lib/cache";

export const getFediAcctFromActor = (username, actor) => {
  const actorURL = parseSafeExternalUrl(actor);
  if (!actorURL) {
    return `@${username}`;
  }
  const domain = actorURL.hostname;
  return `@${username}@${domain}`;
};

export async function fetchActorInformation(actorUrl) {
  const safeActorUrl = parseSafeExternalUrl(actorUrl);
  if (!safeActorUrl) {
    console.error("Rejected unsafe actor URL", actorUrl);
    return null;
  }
  const cacheKey = safeActorUrl.toString();

  // cache actor info
  const cachedActor = cache.get(`activitypub:actor:${cacheKey}`);
  if (cachedActor) {
    return cachedActor;
  }
  try {
    const response = await fetchActivityPubJson(safeActorUrl, {
      headers: {
        "Content-Type": "application/activity+json",
      },
      cache: "force-cache",
    });
    if (!response.ok) {
      throw new Error(`Actor fetch failed with HTTP ${response.status}`);
    }
    const actorInfo = await response.json();
    cache.set(`activitypub:actor:${cacheKey}`, actorInfo, 3600 * 24);
    return actorInfo;
  } catch (error) {
    console.error("Unable to fetch actor information", cacheKey, error);
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
      publicKeyPem: config.activityPubPublicKey,
    },
  });
}
