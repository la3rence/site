import {
  fetchPolymarketProbabilityBoard,
  getEmptyPolymarketProbabilityBoard,
} from "../../lib/polymarket-data-fetcher";

export default async function handler(req, res) {
  try {
    const result = await fetchPolymarketProbabilityBoard();
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching polymarket data:", error);
    res.status(200).json({
      ...getEmptyPolymarketProbabilityBoard(),
      error: "Failed to fetch Polymarket data",
      message: error.message,
    });
  }
}

export const config = {
  api: {
    responseLimit: "4mb",
  },
};
