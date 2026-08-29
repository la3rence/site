import dynamic from "next/dynamic";
import Blog from "../../components/blog";
import cfg from "../../lib/config.mjs";
import withLocalization from "../../components/withI18n";

const KatagoBoard = dynamic(() => import("../../components/katago-board"), {
  ssr: true,
  loading: () => (
    <div className="mx-auto my-8 aspect-square max-w-180 animate-pulse rounded-none bg-zinc-100 dark:bg-zinc-900" />
  ),
});

export const blogProps = {
  author: cfg.authorName,
  id: "go",
  title: "与 AI 对弈",
  title_i18n: { en: "Play Go against AI" },
  description: "与 AI 实时对弈一局围棋",
  date: "2026-08-22",
  locale: "zh",
  i18n: ["zh", "en"],
  tags: "go, game, ai",
  visible: true,
};

function Katago({ translations }) {
  const t = translations;
  return (
    <Blog
      {...blogProps}
      title={t["Play Go against AI"]}
      description={t["Play a real-time game of Go against an AI"]}
      noReply
    >
      <p>{t["Chinese rules, 7.5 komi"]}</p>
      <KatagoBoard />
    </Blog>
  );
}

export default withLocalization(Katago);
