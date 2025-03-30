import { useState } from "react";
import { getCollection } from "../lib/mongo";

export default function Things(props) {
  const [items, setItems] = useState(props.items);

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

export const getStaticProps = async () => {
  const collection = await getCollection("things");
  const items = await collection.find({}).sort({ purchaseDate: -1 }).toArray();
  return {
    props: {
      items: JSON.parse(JSON.stringify(items)),
    },
    revalidate: 3600,
  };
};
