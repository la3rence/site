import { fetchVixData } from "../../lib/vix-data-fetcher";

export default async function handler(req, res) {
  // 设置缓存头，防止客户端缓存
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  try {
    const { dataType = "minute" } = req.query; // 默认获取分钟数据
    const result = await fetchVixData(dataType);
    res.status(200).json(result);
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
