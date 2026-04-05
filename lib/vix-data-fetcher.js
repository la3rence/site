// VIX data fetching functions that can be used both server-side and client-side
// These functions encapsulate the logic for fetching and processing VIX data

import cache from "./cache.js";

export const fetchDailyVixData = async () => {
  const cacheKey = "vix_daily";
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const dataType = "daily";
  const apiUrl = process.env.QVIX_300_DAILY_API;

  if (!apiUrl) {
    throw new Error("Daily API endpoint not configured");
  }

  const apiResponse = await fetch(apiUrl, {
    signal: AbortSignal.timeout(30000),
  });

  if (!apiResponse.ok) {
    throw new Error(`API request failed with status ${apiResponse.status}`);
  }

  const data = await apiResponse.json();

  const processedData = data
    .map(item => {
      const parsedClose = Number.parseFloat(item.close);
      const parsedOpen = Number.parseFloat(item.open);
      const parsedHigh = Number.parseFloat(item.high);
      const parsedLow = Number.parseFloat(item.low);
      const volatility = Number.isFinite(parsedClose)
        ? parseFloat((parsedClose * 100).toFixed(2)) / 100
        : null;
      const open = Number.isFinite(parsedOpen)
        ? parseFloat((parsedOpen * 100).toFixed(2)) / 100
        : null;
      const high = Number.isFinite(parsedHigh)
        ? parseFloat((parsedHigh * 100).toFixed(2)) / 100
        : null;
      const low = Number.isFinite(parsedLow)
        ? parseFloat((parsedLow * 100).toFixed(2)) / 100
        : null;
      const close = Number.isFinite(parsedClose)
        ? parseFloat((parsedClose * 100).toFixed(2)) / 100
        : null;

      const itemDate = new Date(item.date);
      const timestamp = !isNaN(itemDate.getTime()) ? itemDate.getTime() : null;
      const date = timestamp ? new Date(item.date).toLocaleDateString("zh-CN") : null;
      return { date, volatility, open, high, low, close, timestamp };
    })
    .filter(item => item.timestamp !== null && item.volatility !== null)
    .filter(item => {
      const itemDate = new Date(item.date);
      const yearsAgo = new Date();
      yearsAgo.setFullYear(yearsAgo.getFullYear() - 2);
      return itemDate >= yearsAgo;
    })
    .sort((a, b) => a.timestamp - b.timestamp);

  const result = {
    data: processedData,
    timestamp: Date.now(),
    dataType,
  };
  cache.set(cacheKey, result, 3600);
  return result;
};

export const fetchMinuteVixData = async () => {
  const cacheKey = "vix_minute";
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const dataType = "minute";
  const apiUrl = process.env.QVIX_300_MIN_API;

  if (!apiUrl) {
    throw new Error("Minute API endpoint not configured");
  }

  const apiResponse = await fetch(apiUrl, {
    signal: AbortSignal.timeout(30000),
  });

  if (!apiResponse.ok) {
    throw new Error(`API request failed with status ${apiResponse.status}`);
  }

  const data = await apiResponse.json();

  const processedData = data
    .map((item, index) => ({
      time: item.time,
      volatility: item.qvix !== null ? Number(item.qvix.toFixed(2)) : null,
      timestamp: Date.now() + index,
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  const result = {
    data: processedData,
    timestamp: Date.now(),
    dataType,
  };
  cache.set(cacheKey, result, 10);
  return result;
};

export const fetchVixData = async (dataType = "minute") => {
  if (dataType === "daily") {
    return await fetchDailyVixData();
  } else {
    return await fetchMinuteVixData();
  }
};
