import { useEffect, useState } from "react";
import Blog from "../../components/blog";
import PolymarketProbabilityBoard from "../../components/polymarket-probability-board";
import cfg from "../../lib/config.mjs";
import {
  fetchPolymarketProbabilityBoard,
  getEmptyPolymarketProbabilityBoard,
} from "../../lib/polymarket-data-fetcher";

const REFRESH_INTERVAL = 60000;

const createTitle = () => "预测市场";

export const blogProps = {
  author: cfg.authorName,
  title: "预测市场",
  description: "基于 Polymarket 活跃市场的事件发生概率看板",
  date: "2026-06-19",
  locale: "zh",
  visible: true,
  preview: {
    type: "chart",
    source: "polymarket",
    title: "Polymarket 事件概率",
    dataType: "live",
  },
};

export const getStaticProps = async () => {
  try {
    const snapshot = await fetchPolymarketProbabilityBoard();

    return {
      props: {
        serverSnapshot: snapshot,
      },
      revalidate: 60,
    };
  } catch (error) {
    console.error("Error fetching initial polymarket data:", error);

    return {
      props: {
        serverSnapshot: getEmptyPolymarketProbabilityBoard(),
      },
      revalidate: 60,
    };
  }
};

export default function PolymarketPage({ serverSnapshot }) {
  const [snapshot, setSnapshot] = useState(serverSnapshot);

  useEffect(() => {
    let intervalId;
    let inFlight = false;

    const update = async () => {
      if (inFlight || document.hidden) {
        return;
      }

      inFlight = true;

      try {
        const response = await fetch("/api/polymarket-data");

        if (!response.ok) {
          throw new Error(`Failed to fetch Polymarket data: ${response.status}`);
        }

        const nextSnapshot = await response.json();
        setSnapshot(nextSnapshot);
      } catch (error) {
        console.error("Error updating polymarket snapshot:", error);
      } finally {
        inFlight = false;
      }
    };

    update();
    intervalId = setInterval(update, REFRESH_INTERVAL);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        update();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const markets = snapshot?.markets || [];

  return (
    <Blog {...blogProps} title={createTitle()} noReply noMeta>
      <div className="my-2 max-w-4xl m-auto">
        <PolymarketProbabilityBoard markets={markets} />
      </div>
      <p>
        Polymarket
        的核心是可交易的二元事件合约。它越来越值得关注，不是因为把「下注」搬上链，而是因为高关注事件上的流动性、订单深度和连续报价，正在把分散的信息压成一条能实时更新的概率曲线；这使它更像信息市场，而不只是娱乐盘口。与传统赌博也不一样，后者通常是庄家定赔率、玩家承担抽水，前者更像连续交易市场，你面对的是其他交易者和不断进入的新信息，价格既能交易，也能被外部世界拿来做判断。对凯利公式来说，这类市场尤其有用，因为它直接给出了市场价格{" "}
        <code>q</code>；如果你自己的主观概率是 <code>p</code>，就可以据此判断是否存在优势，并用{" "}
        <code>f* = (p - q) / (1 - q)</code>{" "}
        这样的二元凯利形式来约束仓位。实务上通常应采用半凯利或更低仓位，因为你的概率估计误差、手续费、滑点和相关性，往往比公式本身更重要。
      </p>
    </Blog>
  );
}
