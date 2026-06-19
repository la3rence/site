import cache from "./cache.js";
import polymarketWatchlist from "./polymarket-watchlist.json";

const POLYMARKET_EVENTS_API =
  process.env.POLYMARKET_EVENTS_API || "https://gamma-api.polymarket.com/events";
const POLYMARKET_MARKETS_API =
  process.env.POLYMARKET_MARKETS_API || "https://gamma-api.polymarket.com/markets";
const POLYMARKET_HISTORY_API =
  process.env.POLYMARKET_HISTORY_API || "https://clob.polymarket.com/prices-history";
const POLYMARKET_PROXY_URL = process.env.NEXT_PUBLIC_PROXY_URL || "";
const POLYMARKET_CACHE_KEY = "polymarket_probability_board";
const POLYMARKET_CACHE_TTL = 60;
const REQUEST_TIMEOUT_MS = 6000;
const HISTORY_WINDOW_DAYS = 14;

const emptyResult = () => ({
  markets: [],
  timestamp: Date.now(),
});

const parseJsonArray = value => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const parseNumber = value => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseTokenIds = value => {
  const parsed = parseJsonArray(value);
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.filter(item => typeof item === "string" && item.trim() !== "");
};

const clampProbability = value => Math.min(1, Math.max(0, value));

const toPercent = value => Math.round(value * 1000) / 10;

const deriveSeriesLabel = market => {
  if (typeof market.groupItemTitle === "string" && market.groupItemTitle.trim() !== "") {
    return market.groupItemTitle.trim();
  }

  if (typeof market.question !== "string") {
    return "";
  }

  const match = market.question.match(/^Will\s+(.+?)\s+have\b/i);
  return match?.[1]?.trim() || "";
};

const buildMarketUrl = (event, market) => {
  const slug = market.slug || event.slug;
  return slug ? `https://polymarket.com/event/${slug}` : "https://polymarket.com";
};

const normalizeTarget = target => {
  if (!target || typeof target !== "object") {
    return null;
  }

  const type = target.type === "event" ? "event" : "market";
  const slug = typeof target.slug === "string" ? target.slug.trim() : "";

  if (!slug) {
    return null;
  }

  return {
    type,
    slug,
    label: typeof target.label === "string" ? target.label.trim() : "",
  };
};

const getWatchlist = () =>
  Array.isArray(polymarketWatchlist)
    ? polymarketWatchlist.map(normalizeTarget).filter(Boolean)
    : [];

const buildPolymarketRequestUrl = url => {
  if (!POLYMARKET_PROXY_URL) {
    return url;
  }

  return `${POLYMARKET_PROXY_URL}${url.replace(/^https?:\/\//u, "")}`;
};

const fetchJson = async url => {
  const response = await fetch(buildPolymarketRequestUrl(url), {
    headers: {
      accept: "application/json",
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Polymarket API request failed with status ${response.status}`);
  }

  return await response.json();
};

const buildFallbackHistory = market => {
  const currentPrice = market.yesPercent;
  const oneDayDelta = toPercent(parseNumber(market.oneDayPriceChange) ?? 0);
  const startPrice = Math.min(100, Math.max(0, currentPrice - oneDayDelta));
  const now = Date.now();
  const steps = 24;

  return Array.from({ length: steps }, (_, index) => {
    const progress = index / Math.max(steps - 1, 1);
    const price = startPrice + (currentPrice - startPrice) * progress;

    return {
      timestamp: now - (steps - 1 - index) * 60 * 60 * 1000,
      price: Math.round(price * 10) / 10,
    };
  });
};

const normalizeMarket = (event, market) => {
  if (!market?.active || market.closed || market.archived) {
    return null;
  }

  const outcomes = parseJsonArray(market.outcomes);
  const outcomePrices = parseJsonArray(market.outcomePrices);

  if (
    !Array.isArray(outcomes) ||
    !Array.isArray(outcomePrices) ||
    outcomes.length !== outcomePrices.length
  ) {
    return null;
  }

  const normalizedOutcomes = outcomes.map(outcome =>
    typeof outcome === "string" ? outcome.trim().toLowerCase() : "",
  );
  const yesIndex = normalizedOutcomes.findIndex(outcome => outcome === "yes");
  const noIndex = normalizedOutcomes.findIndex(outcome => outcome === "no");

  if (yesIndex === -1 || noIndex === -1) {
    return null;
  }

  const yesProbability = parseNumber(outcomePrices[yesIndex]);
  const noProbability = parseNumber(outcomePrices[noIndex]);
  const clobTokenIds = parseTokenIds(market.clobTokenIds);

  if (yesProbability === null || noProbability === null) {
    return null;
  }

  const probability = clampProbability(yesProbability);
  const endDate = market.endDate || event.endDate || null;
  const endTimestamp = endDate ? Date.parse(endDate) : null;

  if (!market.question || endTimestamp === null || Number.isNaN(endTimestamp)) {
    return null;
  }

  return {
    id: String(market.id),
    eventTitle: event.title || market.question,
    question: market.question,
    seriesLabel: deriveSeriesLabel(market),
    url: buildMarketUrl(event, market),
    yesClobTokenId: clobTokenIds[yesIndex] || "",
    yesPercent: toPercent(probability),
    oneDayPriceChange: parseNumber(market.oneDayPriceChange),
  };
};

const toEventShapeFromMarket = market => {
  const event = Array.isArray(market.events) ? market.events[0] : null;

  if (!event) {
    return null;
  }

  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    endDate: event.endDate,
    markets: [market],
  };
};

const fetchEventBySlug = async slug => {
  const params = new URLSearchParams({ slug });
  const events = await fetchJson(`${POLYMARKET_EVENTS_API}?${params.toString()}`);
  return Array.isArray(events) ? events[0] || null : null;
};

const fetchMarketBySlug = async slug => {
  const params = new URLSearchParams({ slug });
  const markets = await fetchJson(`${POLYMARKET_MARKETS_API}?${params.toString()}`);
  return Array.isArray(markets) ? markets[0] || null : null;
};

const fetchMarketHistory = async clobTokenId => {
  if (!clobTokenId) {
    return [];
  }

  const endTimestamp = Math.floor(Date.now() / 1000);
  const startTimestamp = endTimestamp - HISTORY_WINDOW_DAYS * 24 * 60 * 60;
  const params = new URLSearchParams({
    market: String(clobTokenId),
    startTs: String(startTimestamp),
    endTs: String(endTimestamp),
    fidelity: "60",
  });

  try {
    const payload = await fetchJson(`${POLYMARKET_HISTORY_API}?${params.toString()}`);

    if (!payload || !Array.isArray(payload.history)) {
      return [];
    }

    return payload.history
      .map(point => ({
        timestamp: Number(point.t) * 1000,
        price: toPercent(parseNumber(point.p) ?? 0),
      }))
      .filter(point => Number.isFinite(point.timestamp) && Number.isFinite(point.price));
  } catch (error) {
    console.error(`Error fetching polymarket history for token ${clobTokenId}:`, error);
    return [];
  }
};

const fetchTargetMarkets = async target => {
  if (target.type === "event") {
    const event = await fetchEventBySlug(target.slug);

    if (!event || !Array.isArray(event.markets)) {
      return [];
    }

    return event.markets
      .map(market => normalizeMarket(event, market))
      .filter(Boolean)
      .map(market => ({
        ...market,
        question: target.label || market.question,
        targetType: target.type,
        targetSlug: target.slug,
      }));
  }

  const market = await fetchMarketBySlug(target.slug);
  const event = market ? toEventShapeFromMarket(market) : null;

  if (!market || !event) {
    return [];
  }

  const normalizedMarket = normalizeMarket(event, market);

  if (!normalizedMarket) {
    return [];
  }

  return [
    {
      ...normalizedMarket,
      question: target.label || normalizedMarket.question,
      targetType: target.type,
      targetSlug: target.slug,
    },
  ];
};

export const fetchPolymarketProbabilityBoard = async () => {
  const cached = cache.get(POLYMARKET_CACHE_KEY);
  if (cached) {
    return cached;
  }

  const watchlist = getWatchlist();

  if (watchlist.length === 0) {
    const empty = emptyResult();
    cache.set(POLYMARKET_CACHE_KEY, empty, POLYMARKET_CACHE_TTL);
    return empty;
  }

  const settledTargetResults = await Promise.allSettled(
    watchlist.map(async target => ({
      target,
      markets: await fetchTargetMarkets(target),
    })),
  );
  const targetResults = settledTargetResults
    .filter(result => result.status === "fulfilled")
    .map(result => result.value);

  const markets = targetResults.flatMap(item => item.markets).map(market => ({ ...market }));
  const marketsWithHistory = await Promise.all(
    markets.map(async market => {
      const history = await fetchMarketHistory(market.yesClobTokenId);

      return {
        id: market.id,
        eventTitle: market.eventTitle,
        question: market.question,
        seriesLabel: market.seriesLabel,
        url: market.url,
        yesPercent: market.yesPercent,
        targetType: market.targetType,
        targetSlug: market.targetSlug,
        history: history.length > 0 ? history : buildFallbackHistory(market),
      };
    }),
  );

  const result = {
    markets: marketsWithHistory,
    timestamp: Date.now(),
  };

  cache.set(POLYMARKET_CACHE_KEY, result, POLYMARKET_CACHE_TTL);

  return result;
};

export const getEmptyPolymarketProbabilityBoard = emptyResult;
