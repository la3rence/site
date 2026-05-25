import { Sha256Signer } from "./signature";
import { createHash } from "crypto";
import { lookup } from "dns/promises";
import { isIP } from "net";
import { IS_PROD } from "./env.js";

export const getOrigin = req => {
  const origin = req.headers.host;
  if (IS_PROD) {
    return `https://${origin}`;
  }
  return origin.includes("localhost") ? "http://" + origin : "https://" + origin;
};

export const respondActivityJSON = (res, json) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/activity+json");
  res.end(JSON.stringify(json));
};

const MAX_EXTERNAL_REDIRECTS = 3;

function stripIpv6Brackets(hostname) {
  if (hostname.startsWith("[") && hostname.endsWith("]")) {
    return hostname.slice(1, -1);
  }
  return hostname;
}

function isPrivateOrLoopbackIpv4(ip) {
  const ipv4Regex = /^(?:\d{1,3}\.){3}\d{1,3}$/;
  if (!ipv4Regex.test(ip)) {
    return false;
  }
  const parts = ip.split(".").map(x => parseInt(x, 10));
  if (parts.some(octet => Number.isNaN(octet) || octet < 0 || octet > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 10) {
    return true;
  }
  if (a === 172 && b >= 16 && b <= 31) {
    return true;
  }
  if (a === 192 && b === 168) {
    return true;
  }
  if (a === 127) {
    return true;
  }
  if (a === 169 && b === 254) {
    return true;
  }
  if (a === 0) {
    return true;
  }
  return false;
}

function parseIpv6Hextets(ip) {
  const lowerIp = ip.toLowerCase();
  const [head = "", tail = ""] = lowerIp.split("::");
  if (lowerIp.split("::").length > 2) {
    return null;
  }

  const parsePart = part => part.split(":").filter(Boolean);
  const headParts = parsePart(head);
  const tailParts = parsePart(tail);
  const parts = [...headParts, ...tailParts];
  if (parts.some(part => !/^[0-9a-f]{1,4}$/.test(part))) {
    return null;
  }

  if (lowerIp.includes("::")) {
    const missingParts = 8 - parts.length;
    if (missingParts < 1) {
      return null;
    }
    return [
      ...headParts.map(part => parseInt(part, 16)),
      ...Array(missingParts).fill(0),
      ...tailParts.map(part => parseInt(part, 16)),
    ];
  }

  if (parts.length !== 8) {
    return null;
  }
  return parts.map(part => parseInt(part, 16));
}

function isPrivateOrLoopbackIpv6(ip) {
  const hextets = parseIpv6Hextets(ip);
  if (!hextets) {
    return true;
  }

  const [first] = hextets;
  const isUnspecified = hextets.every(part => part === 0);
  const isLoopback = hextets.slice(0, 7).every(part => part === 0) && hextets[7] === 1;
  const isUniqueLocal = (first & 0xfe00) === 0xfc00;
  const isLinkLocal = (first & 0xffc0) === 0xfe80;
  const isIpv4Mapped = hextets.slice(0, 5).every(part => part === 0) && hextets[5] === 0xffff;

  if (isIpv4Mapped) {
    const mappedIp = [hextets[6] >> 8, hextets[6] & 0xff, hextets[7] >> 8, hextets[7] & 0xff].join(
      ".",
    );
    return isPrivateOrLoopbackIpv4(mappedIp);
  }

  return isUnspecified || isLoopback || isUniqueLocal || isLinkLocal;
}

export function isPrivateOrLocalAddress(hostname) {
  const host = stripIpv6Brackets(hostname.toLowerCase());
  if (host === "localhost" || host.endsWith(".local")) {
    return true;
  }

  const ipVersion = isIP(host);
  if (ipVersion === 4) {
    return isPrivateOrLoopbackIpv4(host);
  }
  if (ipVersion === 6) {
    return isPrivateOrLoopbackIpv6(host);
  }
  return false;
}

export function parseSafeExternalUrl(value, options = {}) {
  const { allowSearch = true, allowHash = false } = options;
  let endpoint;
  try {
    endpoint = value instanceof URL ? new URL(value.toString()) : new URL(value);
  } catch {
    return null;
  }

  if (endpoint.protocol !== "http:" && endpoint.protocol !== "https:") {
    return null;
  }
  if (endpoint.username || endpoint.password) {
    return null;
  }
  if (!allowSearch && endpoint.search) {
    return null;
  }
  if (!allowHash && endpoint.hash) {
    return null;
  }
  if (isPrivateOrLocalAddress(endpoint.hostname)) {
    return null;
  }
  return endpoint;
}

export function assertSafeExternalUrl(value, options) {
  const endpoint = parseSafeExternalUrl(value, options);
  if (!endpoint) {
    throw new Error("Refusing to use unsafe external URL");
  }
  return endpoint;
}

async function assertSafeResolvedHost(hostname) {
  const host = stripIpv6Brackets(hostname.toLowerCase());
  if (isIP(host)) {
    return;
  }

  const addresses = await lookup(host, {
    all: true,
    verbatim: true,
  });
  if (addresses.some(({ address }) => isPrivateOrLocalAddress(address))) {
    throw new Error("Refusing to use external URL that resolves to an unsafe address");
  }
}

export async function fetchActivityPubJson(value, init = {}) {
  let endpoint = assertSafeExternalUrl(value);
  const { headers = {}, ...restInit } = init;

  for (let redirects = 0; redirects <= MAX_EXTERNAL_REDIRECTS; redirects += 1) {
    await assertSafeResolvedHost(endpoint.hostname);
    const response = await fetch(endpoint, {
      ...restInit,
      headers: {
        Accept: "application/activity+json",
        ...headers,
      },
      redirect: "manual",
    });

    if (![301, 302, 303, 307, 308].includes(response.status)) {
      return response;
    }

    const location = response.headers.get("location");
    if (!location) {
      return response;
    }

    endpoint = assertSafeExternalUrl(new URL(location, endpoint));
  }

  throw new Error("Too many redirects while fetching ActivityPub resource");
}

function assertSafeSignedEndpoint(endpoint) {
  const safeEndpoint = assertSafeExternalUrl(endpoint, {
    allowSearch: false,
    allowHash: false,
  });
  if (safeEndpoint.pathname.includes("..")) {
    throw new Error("Refusing to send request to unsafe endpoint path");
  }
  return safeEndpoint;
}

export function getActivityPubInboxUrl(actorUrl) {
  const actorEndpoint = assertSafeExternalUrl(actorUrl, {
    allowSearch: false,
    allowHash: false,
  });
  return assertSafeSignedEndpoint(new URL("/inbox", actorEndpoint.origin));
}

function isSafeEndpoint(endpoint) {
  try {
    assertSafeSignedEndpoint(endpoint);
  } catch {
    return false;
  }
  return true;
}

export async function sendSignedRequest(publicKeyId, endpoint, object) {
  const safeEndpoint = assertSafeSignedEndpoint(endpoint);
  if (!isSafeEndpoint(safeEndpoint)) {
    throw new Error("Refusing to send request to unsafe endpoint");
  }
  await assertSafeResolvedHost(safeEndpoint.hostname);

  const privateKey = process.env.ACTIVITYPUB_PRIVATE_KEY;
  const signer = new Sha256Signer({
    publicKeyId,
    privateKey,
    headerNames: ["host", "date", "digest"],
  });

  const requestHeaders = {
    host: safeEndpoint.host,
    date: new Date().toUTCString(),
    digest: `SHA-256=${createHash("sha256").update(JSON.stringify(object)).digest("base64")}`,
  };

  const signature = signer.sign({
    url: safeEndpoint,
    method: "POST",
    headers: requestHeaders,
  });

  const response = await fetch(safeEndpoint, {
    method: "POST",
    body: JSON.stringify(object),
    redirect: "manual",
    headers: {
      "content-type": "application/activity+json",
      accept: "application/activity+json",
      ...requestHeaders,
      signature: signature,
    },
  });
  return response;
}
