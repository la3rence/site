import { useState } from "react";
import Header from "../components/header";
import { getCollection } from "../lib/mongo";
import cache from "../lib/cache";

const SortIndicator = ({ column, sortConfig }) => {
  if (sortConfig.key !== column) return null;
  return <span className="ml-1">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>;
};

export default function Things(props) {
  const [items, setItems] = useState(props.items);
  const title = "Things";

  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

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
  // const SortIndicator = ({ column }) => {
  //   if (sortConfig.key !== column) return null;
  //   return <span className="ml-1">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>;
  // };

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
    <>
      <Header title={title} tags={title} />
      <div className="max-w-4xl mx-auto">
        <h1 id="title" className={`articleTitle text-balance text-2xl mb-0 mt-14`}>
          {title}
        </h1>
        <div className="mt-10">
          <table className="min-w-full">
            <thead>
              <tr className="sticky top-0 z-50 bg-white dark:bg-zinc-900 shadow-2xs">
                <th className="py-4">设备</th>
                <th className="cursor-pointer" onClick={() => handleSort("purchaseDate")}>
                  日期
                  <SortIndicator column="purchaseDate" sortConfig={sortConfig} />
                </th>
                <th className="cursor-pointer" onClick={() => handleSort("price")}>
                  价格
                  <SortIndicator column="price" sortConfig={sortConfig} />
                </th>
                <th className="cursor-pointer" onClick={() => handleSort("daysOwned")}>
                  天数
                  <SortIndicator column="daysOwned" sortConfig={sortConfig} />
                </th>
                <th className="cursor-pointer" onClick={() => handleSort("dailyCost")}>
                  日均
                  <SortIndicator column="dailyCost" sortConfig={sortConfig} />
                </th>
                <th className="py-4">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item, index) => (
                <tr
                  key={index}
                  className="transition-all border-b border-zinc-300 duration-200
                 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:border-zinc-700"
                >
                  <td className="text-balance py-4">
                    <span className="mx-1 pl-2">{item.emoji}</span>
                    {item.name}
                  </td>
                  <td className="text-center font-mono">{item.purchaseDate}</td>
                  <td className="text-center">{item.price?.toLocaleString()}￥</td>
                  <td className="text-center">{calculateDaysOwned(item.purchaseDate)}</td>
                  <td className="text-center">
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
    </>
  );
}

export const getStaticProps = async () => {
  if (cache.has("things")) {
    return {
      props: {
        items: JSON.parse(cache.get("things")),
      },
      revalidate: 3600,
    };
  }
  const collection = await getCollection("things");
  const items = await collection.find({}).sort({ purchaseDate: -1 }).toArray();
  cache.set("things", JSON.stringify(items));
  return {
    props: {
      items: JSON.parse(JSON.stringify(items)),
    },
    revalidate: 7200,
  };
};
