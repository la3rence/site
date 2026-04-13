import {
  CartesianGrid,
  Dot,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function VixChart({ data, viewMode }) {
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
