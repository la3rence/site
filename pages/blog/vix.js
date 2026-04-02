import { useEffect, useState } from "react";
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

// 服务端渲染时获取初始数据
export const getServerSideProps = async () => {
  try {
    // 构建完整的API URL，适用于服务器端
    const reqOrigin = process.env.NODE_ENV === "production" ? cfg.baseURL : "http://localhost:3000";

    // 通过API路由获取数据而不是直接调用外部API
    const dailyRes = await fetch(`${reqOrigin}/api/vix-data?dataType=daily`);
    const dailyData = await dailyRes.json();

    const minuteRes = await fetch(`${reqOrigin}/api/vix-data?dataType=minute`);
    const minuteData = await minuteRes.json();

    const dailyPoints = dailyData.data || [];
    const minutePoints = minuteData.data || [];

    const validPoints = minutePoints.filter(item => item.volatility != null);
    const latestData = validPoints[validPoints.length - 1] ?? null;
    const current = latestData?.volatility ?? null;

    return {
      props: {
        serverDailyPoints: dailyPoints,
        serverMinutePoints: minutePoints,
        serverCurrent: current,
        initialTimestamp: Date.now(),
      },
    };
  } catch (error) {
    console.error("Error fetching initial data:", error);

    return {
      props: {
        serverDailyPoints: [],
        serverMinutePoints: [],
        serverCurrent: null,
        initialTimestamp: Date.now(),
      },
    };
  }
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
  const [dailyData] = useState(props.serverDailyPoints);
  const [minuteData, setMinuteData] = useState(props.serverMinutePoints);
  const [current, setCurrent] = useState(props.serverCurrent);
  const [lastUpdated, setLastUpdated] = useState(new Date(props.initialTimestamp));
  const [loading, setLoading] = useState(false);

  // 判断当前是否在中国股市交易时间内 (北京时间 9:30-15:00)
  const isChinaMarketHours = () => {
    // 获取UTC时间
    const utcTime = new Date();

    // 计算北京时间（UTC+8）
    const beijingTime = new Date(utcTime.getTime() + 8 * 60 * 60 * 1000);

    // 获取星期几 (0=周日, 1=周一, ..., 6=周六)
    const dayOfWeek = beijingTime.getUTCDay();

    // 检查是否是周一到周五
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false; // 周末不交易
    }

    // 获取小时和分钟
    const hour = beijingTime.getUTCHours();
    const minute = beijingTime.getUTCMinutes();

    // 检查是否在 9:30-15:00 之间
    const timeInMinutes = hour * 60 + minute;
    const marketOpenTime = 9 * 60 + 30; // 9:30 AM
    const marketCloseTime = 15 * 60 + 0; // 3:00 PM

    return timeInMinutes >= marketOpenTime && timeInMinutes < marketCloseTime;
  };

  // 客户端轮询更新数据
  useEffect(() => {
    const fetchData = async dataType => {
      try {
        const response = await fetch(`/api/vix-data?dataType=${dataType}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${dataType} data: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error(`Error fetching ${dataType} data:`, error);
        return null;
      }
    };

    const updateData = async () => {
      if (!isChinaMarketHours()) {
        return; // 不在交易时间内则不更新
      }

      setLoading(true);

      // 只获取分钟数据
      const minuteResult = await fetchData("minute");

      if (minuteResult) {
        setMinuteData(minuteResult.data);

        // 更新当前波动率
        const validPoints = minuteResult.data.filter(item => item.volatility != null);
        const latestData = validPoints[validPoints.length - 1] ?? null;
        setCurrent(latestData?.volatility ?? null);
      }

      setLastUpdated(new Date());
      setLoading(false);
    };

    // 立即更新一次
    // updateData();

    // 设置 30 秒定时器进行自动更新（交易时间）
    let intervalId;
    const scheduleUpdates = () => {
      if (isChinaMarketHours()) {
        intervalId = setInterval(updateData, 30000); // 30秒
      } else {
        // 检查到非交易时间，设置一个计时器在下一个交易时间段开始时重新启动轮询
        const checkMarketHours = () => {
          if (isChinaMarketHours()) {
            // 开始轮询
            intervalId = setInterval(updateData, 30000);
            return; // 退出检查循环
          } else {
            // 继续检查
            setTimeout(checkMarketHours, 60000); // 每分钟检查一次
          }
        };

        // 开始检查市场时间
        setTimeout(checkMarketHours, 60000); // 一分钟后再次检查
      }
    };

    scheduleUpdates();

    // 监听窗口聚焦事件，以便在用户回来时立即检查
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // 页面可见时，重新检查市场时间并重启轮询（如果需要）
        if (intervalId) {
          clearInterval(intervalId);
        }
        scheduleUpdates();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 清理函数
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <Blog {...blogProps} title={`${blogProps.title}: ${current || "加载中..."}`} noReply noMeta>
      <div className="h-72 md:h-96 w-full text-center my-10">
        <div className="mb-2">
          沪深 300 股指期权隐含波动率 当前: {current !== null ? current.toFixed(2) : "加载中..."}
        </div>
        <div className="text-xs text-gray-500 mb-2">
          最后更新: {lastUpdated.toLocaleTimeString("zh-CN")} {loading && "(自动更新中...)"}
          {!isChinaMarketHours() && " (非交易时间)"}
        </div>
        <Chart data={minuteData} viewMode="minute" />
      </div>
      {dailyData?.length > 0 ? (
        <div className="h-72 md:h-96 w-full text-center my-10">
          <div>沪深 300 股指期权隐含波动率 历史</div>
          <Chart data={dailyData} viewMode="daily" />
        </div>
      ) : (
        <div className="h-72 md:h-96 w-full text-center my-10 flex items-center justify-center">
          <p>正在加载历史数据...</p>
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
        <p className="text-xs text-gray-700 dark:text-gray-400">{`隐含波动率: ${payload[0].value}%`}</p>
        <p className="text-xs text-gray-600 dark:text-gray-500">
          {viewMode === "daily" ? `日期: ${label}` : `时间: ${label}`}
        </p>
        {viewMode === "daily" && data.open && (
          <div className="space-y-1">
            <p className="text-xs text-gray-600 dark:text-gray-500">{`开盘: ${data.open}%`}</p>
            <p className="text-xs text-gray-600 dark:text-gray-500">{`最高: ${data.high}%`}</p>
            <p className="text-xs text-gray-600 dark:text-gray-500">{`最低: ${data.low}%`}</p>
            <p className="text-xs text-gray-600 dark:text-gray-500">{`收盘: ${data.close}%`}</p>
          </div>
        )}
      </div>
    );
  }
  return null;
};
