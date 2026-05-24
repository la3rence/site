import config from "../../../lib/config.mjs";
import { getOrigin, respondActivityJSON } from "../../../lib/util.js";
import cache from "../../../lib/cache";

const isPrivateOrLocalAddress = hostname => {
  const host = hostname.toLowerCase();

  if (host === "localhost" || host === "::1" || host === "[::1]") {
    return true;
  }

  const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4Match) {
    return false;
  }

  const octets = ipv4Match.slice(1).map(Number);
  if (octets.some(o => Number.isNaN(o) || o < 0 || o > 255)) {
    return true;
  }

  const [a, b] = octets;
  return (
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a === 0
  );
};

const normalizeAndValidateActorUrl = actorUrl => {
  let parsed;
  try {
    parsed = new URL(actorUrl);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return null;
  }

  if (parsed.username || parsed.password) {
    return null;
  }

  if (isPrivateOrLocalAddress(parsed.hostname)) {
    return null;
  }

  return parsed.toString();
};

export const getFediAcctFromActor = (username, actor) => {
  const actorURL = new URL(actor);
  const domain = actorURL.hostname;
  return `@${username}@${domain}`;
};

export async function fetchActorInformation(actorUrl) {
  const safeActorUrl = normalizeAndValidateActorUrl(actorUrl);
  if (!safeActorUrl) {
    console.error("Rejected unsafe actor URL", actorUrl);
    return null;
  }

  // cache actor info
  const cachedActor = cache.get(`activitypub:actor:${safeActorUrl}`);
  if (cachedActor) {
    return cachedActor;
  }
  try {
    const response = await fetch(safeActorUrl, {
      headers: {
        "Content-Type": "application/activity+json",
        Accept: "application/activity+json",
      },
      cache: "force-cache",
    });
    const actorInfo = await response.json();
    cache.set(`activitypub:actor:${safeActorUrl}`, actorInfo, 3600 * 24);
    return actorInfo;
  } catch (error) {
    console.error("Unable to fetch action information", safeActorUrl, error);
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
