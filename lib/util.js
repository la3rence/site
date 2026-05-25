import { Sha256Signer } from "./signature";
import { createHash } from "crypto";
import { lookup } from "dns/promises";
import { request as httpRequest } from "http";
import { request as httpsRequest } from "https";
import { BlockList, isIP } from "net";
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
const EXTERNAL_REQUEST_TIMEOUT_MS = 10000;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const PRIVATE_ADDRESS_BLOCKS = new BlockList();

for (const [address, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
]) {
  PRIVATE_ADDRESS_BLOCKS.addSubnet(address, prefix, "ipv4");
}

for (const [address, prefix] of [
  ["::", 128],
  ["::1", 128],
  ["::ffff:0:0", 96],
  ["64:ff9b::", 96],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
  ["2001::", 32],
  ["2001:db8::", 32],
  ["2002::", 16],
]) {
  PRIVATE_ADDRESS_BLOCKS.addSubnet(address, prefix, "ipv6");
}

function stripIpv6Brackets(hostname) {
  if (hostname.startsWith("[") && hostname.endsWith("]")) {
    return hostname.slice(1, -1);
  }
  return hostname;
}

export function isPrivateOrLocalAddress(hostname) {
  const host = stripIpv6Brackets(hostname.toLowerCase());
  if (host === "localhost" || host.endsWith(".local")) {
    return true;
  }

  const ipVersion = isIP(host);
  if (!ipVersion) {
    return false;
  }
  return PRIVATE_ADDRESS_BLOCKS.check(host, ipVersion === 4 ? "ipv4" : "ipv6");
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

async function resolveSafeHost(hostname) {
  const host = stripIpv6Brackets(hostname.toLowerCase());
  if (isIP(host)) {
    return {
      address: host,
      family: isIP(host),
    };
  }

  const addresses = await lookup(host, {
    all: true,
    verbatim: true,
  });
  const safeAddress = addresses.find(({ address }) => !isPrivateOrLocalAddress(address));
  if (!safeAddress) {
    throw new Error("Refusing to use external URL that resolves to an unsafe address");
  }
  return safeAddress;
}

function normalizeRequestHeaders(headers = {}) {
  const entries = headers instanceof Headers ? headers.entries() : Object.entries(headers);
  const normalized = {};
  for (const [name, value] of entries) {
    if (name.toLowerCase() !== "host") {
      normalized[name] = value;
    }
  }
  return normalized;
}

function buildRequestOptions(endpoint, address, family, init) {
  return {
    hostname: address,
    family,
    port: endpoint.port || (endpoint.protocol === "https:" ? 443 : 80),
    path: `${endpoint.pathname}${endpoint.search}`,
    method: init.method ?? (init.body ? "POST" : "GET"),
    servername: endpoint.hostname,
    headers: {
      ...normalizeRequestHeaders(init.headers),
      host: endpoint.host,
    },
  };
}

function toWebHeaders(headers) {
  const responseHeaders = new Headers();
  for (const [name, value] of Object.entries(headers)) {
    if (Array.isArray(value)) {
      value.forEach(item => responseHeaders.append(name, item));
    } else if (value !== undefined) {
      responseHeaders.set(name, value);
    }
  }
  return responseHeaders;
}

function toWebResponse(response, chunks) {
  return new Response(Buffer.concat(chunks), {
    status: response.statusCode ?? 502,
    statusText: response.statusMessage,
    headers: toWebHeaders(response.headers),
  });
}

function sendExternalRequest(endpoint, address, family, init) {
  const transport = endpoint.protocol === "https:" ? httpsRequest : httpRequest;
  const options = buildRequestOptions(endpoint, address, family, init);

  return new Promise((resolve, reject) => {
    const request = transport(options, response => {
      const chunks = [];
      response.on("data", chunk => chunks.push(chunk));
      response.on("end", () => resolve(toWebResponse(response, chunks)));
    });
    request.setTimeout(EXTERNAL_REQUEST_TIMEOUT_MS, () =>
      request.destroy(new Error("External request timed out")),
    );
    request.on("error", reject);
    request.end(init.body);
  });
}

async function requestSafeExternalUrl(endpoint, init = {}) {
  const safeEndpoint = assertSafeExternalUrl(endpoint);
  const { address, family } = await resolveSafeHost(safeEndpoint.hostname);
  return sendExternalRequest(safeEndpoint, address, family, init);
}

export async function fetchActivityPubJson(value, init = {}) {
  let endpoint = assertSafeExternalUrl(value);
  const { headers = {}, ...restInit } = init;

  for (let redirects = 0; redirects <= MAX_EXTERNAL_REDIRECTS; redirects += 1) {
    const response = await requestSafeExternalUrl(endpoint, {
      ...restInit,
      headers: {
        Accept: "application/activity+json",
        ...headers,
      },
    });

    if (!REDIRECT_STATUSES.has(response.status)) {
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

  const response = await requestSafeExternalUrl(safeEndpoint, {
    method: "POST",
    body: JSON.stringify(object),
    headers: {
      "content-type": "application/activity+json",
      accept: "application/activity+json",
      ...requestHeaders,
      signature: signature,
    },
  });
  return response;
}
