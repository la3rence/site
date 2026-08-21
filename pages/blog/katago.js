import dynamic from "next/dynamic";
import Blog from "../../components/blog";
import cfg from "../../lib/config.mjs";

const KatagoBoard = dynamic(() => import("../../components/katago-board"), {
  ssr: true,
  loading: () => (
    <div className="mx-auto my-8 aspect-square max-w-[720px] animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-900" />
  ),
});

export const blogProps = {
  author: cfg.authorName,
  title: "与 KataGo 对弈",
  description: "与 AI 实时对弈一局围棋",
  date: "2026-08-21",
  locale: "zh",
  tags: "go, game, ai",
  visible: true,
};

export default function Katago() {
  return (
    <Blog {...blogProps} noReply>
      <p>中国规则，贴 7 目半。</p>
      <KatagoBoard />
    </Blog>
  );
}
