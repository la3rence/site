import Blog from "../../components/blog";
import cfg from "../../lib/config.mjs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Dot,
} from "recharts";

export const blogProps = {
  author: cfg.authorName,
  title: "A 股恐慌指数",
  description: "沪深 300 股指期权隐含波动率",
  date: "2025-09-28",
  locale: "zh",
  visible: true,
};

const viewMode = "daily"; // currently only support daily data.

export const getStaticProps = async () => {
  const data = await fetch(process.env.QVIX_300_DAILY_API, { cache: "no-cache" });
  const resp = await data.json();
  const dailyPoints = resp
    .filter(item => item.close != null)
    .filter(item => {
      const itemDate = new Date(item.date);
      const yearsAgo = new Date();
      yearsAgo.setFullYear(yearsAgo.getFullYear() - 2);
      return itemDate >= yearsAgo;
    })
    .map(item => ({
      date: new Date(item.date).toLocaleDateString("zh-CN"),
      volatility: Number(item.close?.toFixed(2)),
      open: Number(item.open?.toFixed(2)),
      high: Number(item.high?.toFixed(2)),
      low: Number(item.low?.toFixed(2)),
      close: Number(item.close?.toFixed(2)),
      timestamp: new Date(item.date).getTime(),
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
  const latestPoint = dailyPoints[dailyPoints.length - 1] ?? null;
  const dailyLatest = latestPoint?.volatility ?? null;
  return {
    props: {
      dailyPoints,
      dailyLatest,
    },
    revalidate: 3600, // an hour
  };
};

export default function Vix(props) {
  const data = props.dailyPoints;
  const dailyLatest = props.dailyLatest;
  const hasLatest = typeof dailyLatest === "number" && Number.isFinite(dailyLatest);
  let colorClass = hasLatest ? "" : "text-gray-400";
  if (hasLatest && dailyLatest < 15) {
    colorClass = "text-green-600";
  } else if (hasLatest && dailyLatest <= 20) {
    colorClass = "text-yellow-600";
  } else if (hasLatest && dailyLatest <= 25) {
    colorClass = "text-orange-600";
  } else if (hasLatest && dailyLatest > 25) {
    colorClass = "text-red-600";
  }
  const latestLabel = hasLatest ? `${dailyLatest}` : "暂无数据";
  return (
    <Blog {...blogProps} title={`${blogProps.title}: ${latestLabel}`} noReply noMeta>
      <div className="h-72 md:h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 30, right: 20, left: 0, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
            <XAxis
              dataKey={viewMode === "daily" ? "date" : "time"}
              fontSize={10}
              tickLine={false}
              axisLine={false}
              angle={viewMode === "daily" ? -45 : 0}
              textAnchor={viewMode === "daily" ? "end" : "middle"}
              height={viewMode === "daily" ? 60 : 30}
            />
            <YAxis
              fontSize={10}
              tickLine={false}
              axisLine={false}
              domain={["dataMin - 1", "dataMax + 1"]}
              tickFormatter={value => `${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="volatility"
              strokeWidth={2.5}
              dot={<CustomDot data={data} />}
              activeDot={{
                r: 5,
                strokeWidth: 2,
              }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p>
        当前恐慌指数:{" "}
        <strong className={colorClass}>{hasLatest ? `${dailyLatest}%` : "暂无数据"}</strong>
        。该数据基于沪深 30 指数期权计算的隐含波动率指数，反映了市场对未来 30 天股价波动的预期.
        数值越高表示市场预期波动越大，投资者情绪越紧张.
      </p>
      <p className="flex flex-wrap gap-2 mt-4">
        <span className="text-green-600 border rounded-4xl text-xs py-1 px-2">
          &lt;15: 市场平静
        </span>
        <span className="text-yellow-600 border rounded-4xl text-xs py-1 px-2">
          15-20: 正常波动
        </span>
        <span className="text-orange-600 border rounded-4xl text-xs py-1 px-2">
          20-25: 市场紧张
        </span>
        <span className="text-red-600 border rounded-4xl text-xs py-1 px-2">&gt;25: 市场恐慌</span>
      </p>
    </Blog>
  );
}

const CustomDot = props => {
  const { cx, cy, payload, data } = props;
  const validData = data.filter(item => item.volatility !== null);
  const isLatestPoint = validData.length > 0 && payload === validData[validData.length - 1];
  if (isLatestPoint) {
    return (
      <g>
        <Dot cx={cx} cy={cy} r={4} fill={"#60a5fa"} stroke="#1e40af" strokeWidth={2} />
        <circle cx={cx} cy={cy} r={7} fill="none" stroke="#60a5fa" strokeWidth={1} opacity={0.3} />
      </g>
    );
  }
  return null;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-sm p-0 shadow-xs backdrop-blur-xs">
        <p className="text-xs text-gray-700 dark:text-gray-200">{`隐含波动率: ${payload[0].value}%`}</p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {viewMode === "daily" ? `日期: ${label}` : `时间: ${label}`}
        </p>
        {viewMode === "daily" && data.open && (
          <div className="space-y-1">
            <p className="text-xs text-gray-600 dark:text-gray-400">{`开盘: ${data.open}%`}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">{`最高: ${data.high}%`}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">{`最低: ${data.low}%`}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">{`收盘: ${data.close}%`}</p>
          </div>
        )}
      </div>
    );
  }
  return null;
};
