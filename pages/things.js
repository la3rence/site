import { useState } from "react";

export default function Things() {
  const [items, setItems] = useState([
    {
      name: "小米电视 S55 MiniLED",
      purchaseDate: "2025-01-18",
      price: 2239,
      status: "在用",
      emoji: "📺",
    },
    {
      name: "HHKB Hybrid Type-S",
      purchaseDate: "2024-07-25",
      price: 2499,
      status: "在用",
      emoji: "⌨️",
    },
    {
      name: "PlayStation 5",
      purchaseDate: "2024-04-05",
      price: 3459,
      status: "闲置",
      emoji: "🎮",
    },
    {
      name: "Bellory Slim Sleeve",
      purchaseDate: "2023-03-16",
      price: 479,
      status: "在用",
      emoji: "💰",
    },
    {
      name: "ASUS Router",
      purchaseDate: "2023-02-14",
      price: 744,
      status: "在用",
      emoji: "📶",
    },
    {
      name: "Apple TV",
      purchaseDate: "2023-01-16",
      price: 1465,
      status: "在用",
      emoji: "📺",
    },
    {
      name: "Razer Basilisk V3",
      purchaseDate: "2022-09-02",
      price: 199,
      status: "在用",
      emoji: "🖱️",
    },
    {
      name: "Aqara G3 网关",
      purchaseDate: "2022-01-09",
      price: 382,
      status: "在用",
      emoji: "🏠",
    },
    {
      name: "iPhone 13",
      purchaseDate: "2021-10-10",
      price: 5999,
      status: "在用",
      emoji: "📱",
    },
    {
      name: "Pixel 4a",
      purchaseDate: "2021-09-26",
      price: 2450,
      status: "闲置",
      emoji: "📱",
    },
    {
      name: "AirPods Pro",
      purchaseDate: "2020-06-01",
      price: 1999,
      status: "在用",
      emoji: "🎧",
    },
    {
      name: "XGIMI Z6",
      purchaseDate: "2019-12-01",
      price: 2299,
      status: "闲置",
      emoji: "📽️",
    },
    {
      name: "MacBook Pro Intel",
      purchaseDate: "2019-08-22",
      price: 16999,
      status: "损坏",
      emoji: "💻",
    },
    {
      name: "IKBC Keyboard",
      purchaseDate: "2019-01-21",
      price: 374,
      status: "闲置",
      emoji: "⌨️",
    },
    {
      name: "Apple Watch Series 4",
      purchaseDate: "2018-10-27",
      price: 3999,
      status: "闲置",
      emoji: "⌚",
    },
    {
      name: "Beats Wireless 3",
      purchaseDate: "2016-10-15",
      price: 2288,
      status: "闲置",
      emoji: "🎧",
    },
    {
      name: "iPad Air 2",
      purchaseDate: "2016-05-18",
      price: 3288,
      status: "闲置",
      emoji: "📱",
    },
    {
      name: "Kindle",
      purchaseDate: "2015-04-17",
      price: 507,
      status: "闲置",
      emoji: "📚",
    },
  ]);

  const [sortConfig, setSortConfig] = useState({
    key: "purchaseDate",
    direction: "desc",
  });

  // 排序处理函数
  const handleSort = key => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    const sortedItems = [...items].sort((a, b) => {
      if (key === "purchaseDate") {
        return direction === "asc"
          ? new Date(a[key]) - new Date(b[key])
          : new Date(b[key]) - new Date(a[key]);
      }
      if (key === "price") {
        return direction === "asc" ? a[key] - b[key] : b[key] - a[key];
      }
      if (key === "daysOwned") {
        const daysA = calculateDaysOwned(a.purchaseDate);
        const daysB = calculateDaysOwned(b.purchaseDate);
        return direction === "asc" ? daysA - daysB : daysB - daysA;
      }
      if (key === "dailyCost") {
        const costA = parseFloat(calculateDailyCost(a.price, a.purchaseDate));
        const costB = parseFloat(calculateDailyCost(b.price, b.purchaseDate));
        return direction === "asc" ? costA - costB : costB - costA;
      }
      return 0;
    });

    setItems(sortedItems);
  };

  // 排序指示器组件
  const SortIndicator = ({ column }) => {
    if (sortConfig.key !== column) return null;
    return <span className="ml-1">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>;
  };

  const calculateDaysOwned = purchaseDate => {
    const purchase = new Date(purchaseDate);
    const today = new Date();
    const diffTime = Math.abs(today - purchase);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateDailyCost = (price, purchaseDate) => {
    const daysOwned = calculateDaysOwned(purchaseDate);
    return (price / daysOwned).toFixed(2);
  };

  const StatusDot = ({ status }) => (
    <span
      className={`inline-block w-5 h-5 rounded-full
        ${
          status === "在用"
            ? "bg-green-500"
            : status === "闲置"
              ? "bg-orange-300"
              : status === "损坏"
                ? "bg-red-600"
                : "bg-gray-600"
        }
      `}
      title={status}
    />
  );

  return (
    <div className="mt-20 p-8 max-w-4xl mx-auto">
      <h3 className="mt-10 text-6xl font-bold">Things</h3>
      <h4>Updated: 2025</h4>
      <div className="mt-10 -mx-6 overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="text-center py-4">设备名称</th>
              <th
                className="text-center py-4 font-mono cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={() => handleSort("purchaseDate")}
              >
                日期
                <SortIndicator column="purchaseDate" />
              </th>
              <th
                className="text-center py-4 font-mono cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={() => handleSort("price")}
              >
                价格
                <SortIndicator column="price" />
              </th>
              <th
                className="text-center py-4 font-mono cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={() => handleSort("daysOwned")}
              >
                天数
                <SortIndicator column="daysOwned" />
              </th>
              <th
                className="text-center py-4 font-mono cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={() => handleSort("dailyCost")}
              >
                日均
                <SortIndicator column="dailyCost" />
              </th>
              <th className="text-center py-4">状态</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-b hover:bg-zinc-200 dark:hover:bg-zinc-800">
                <td className="py-4">
                  <span className="mx-1">{item.emoji}</span>
                  {item.name}
                </td>
                <td className="text-center py-4 font-mono">{item.purchaseDate}</td>
                <td className="text-center py-4 font-mono">{item.price.toLocaleString()}￥</td>
                <td className="text-center py-4 font-mono">
                  {calculateDaysOwned(item.purchaseDate)}
                </td>
                <td className="text-center py-4 font-mono">
                  {calculateDailyCost(item.price, item.purchaseDate)}￥
                </td>
                <td className="py-4 flex items-center justify-center">
                  <StatusDot status={item.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
