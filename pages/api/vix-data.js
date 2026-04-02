export default async function handler(req, res) {
  // 设置缓存头，防止客户端缓存
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  try {
    // 从环境变量获取API端点
    const { dataType = "minute" } = req.query; // 默认获取分钟数据
    const apiUrl =
      dataType === "daily" ? process.env.QVIX_300_DAILY_API : process.env.QVIX_300_MIN_API;

    if (!apiUrl) {
      return res.status(500).json({ error: "API endpoint not configured" });
    }

    const apiResponse = await fetch(apiUrl, {
      signal: AbortSignal.timeout(30000),
    });

    if (!apiResponse.ok) {
      throw new Error(`API request failed with status ${apiResponse.status}`);
    }

    const data = await apiResponse.json();

    // 根据请求的数据类型处理数据
    let processedData;
    if (dataType === "daily") {
      processedData = data
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
    } else {
      // 分钟数据处理
      processedData = data
        .map((item, index) => ({
          time: item.time,
          volatility: item.qvix !== null ? Number(item.qvix.toFixed(2)) : null,
          timestamp: Date.now() + index,
        }))
        .sort((a, b) => a.timestamp - b.timestamp);
    }

    res.status(200).json({
      data: processedData,
      timestamp: Date.now(),
      dataType,
    });
  } catch (error) {
    console.error("Error fetching vix data:", error);
    res.status(500).json({
      error: "Failed to fetch data",
      message: error.message,
    });
  }
}

export const config = {
  api: {
    responseLimit: "10mb", // 增加响应大小限制以处理大量数据
  },
};
