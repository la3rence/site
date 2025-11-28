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

export const getStaticProps = async () => {
  let dailyResp = [];
  let minuteResp = [];

  // 单独请求日线数据
  try {
    const dailyData = await fetch(process.env.QVIX_300_DAILY_API, {
      signal: AbortSignal.timeout(20000),
    }).then(res => res.json());
    dailyResp = dailyData;
  } catch (error) {
    if (error.name === "TimeoutError") {
      console.error("Daily data request timed out");
    } else {
      console.error("Error fetching daily data:", error);
    }
  }

  // 单独请求分钟数据
  try {
    const minuteData = await fetch(process.env.QVIX_300_MIN_API, {
      cache: "no-cache",
      signal: AbortSignal.timeout(30000),
    }).then(res => res.json());
    minuteResp = minuteData;
  } catch (error) {
    if (error.name === "TimeoutError") {
      console.error("Minute data request timed out");
    } else {
      console.error("Error fetching minute data:", error);
    }
  }

  const dailyPoints = dailyResp
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

  const minutePoints = minuteResp
    .map((item, index) => ({
      time: item.time,
      volatility: item.qvix !== null ? Number(item.qvix.toFixed(2)) : null,
      timestamp: Date.now() + index,
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
  const validPoints = minutePoints.filter(item => item.volatility != null);
  const latestData = validPoints[validPoints.length - 1] ?? null;
  const current = latestData?.volatility ?? null;

  return {
    props: {
      dailyPoints,
      minutePoints,
      current,
    },
    revalidate: 45,
  };
};

const Chart = ({ data, viewMode }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 30, right: 20, left: 0, bottom: 30 }}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-25" />
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
        <Tooltip content={<CustomTooltip viewMode={viewMode} />} />
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
  );
};

export default function Vix(props) {
  const dailyData = props.dailyPoints;
  const minuteData = props.minutePoints;
  const current = props.current;
  return (
    <Blog {...blogProps} title={`${blogProps.title}: ${current}`} noReply noMeta>
      <div className="h-72 md:h-96 w-full text-center my-10">
        <div>沪深 300 股指期权隐含波动率 当前</div>
        <Chart data={minuteData} viewMode="minute" />
      </div>
      {dailyData?.length > 0 && (
        <div className="h-72 md:h-96 w-full text-center my-10">
          <div>沪深 300 股指期权隐含波动率 历史</div>
          <Chart data={dailyData} viewMode="daily" />
        </div>
      )}
      <p>
        该数据基于沪深 300 指数期权计算的隐含波动率，反映了市场对未来 30 天股价波动的预期。
        数值越高表示市场预期波动越大，投资者情绪越紧张。
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

const CustomTooltip = ({ active, payload, label, viewMode }) => {
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
