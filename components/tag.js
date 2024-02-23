import Link from "next/link";
import config from "../lib/config.mjs";

export default function Tag(props) {
  const highlight = props.highlight
    ? "bg-zinc-200 dark:bg-zinc-600"
    : "hover:bg-zinc-200 dark:hover:bg-zinc-600";
  return (
    <Link
      href={`/tag/${props.tag.toLowerCase().trim()}`}
      className="no-underline"
      locale={config.defaultLocale}
    >
      <span
        className={`before:content-['#'] duration-100 transition rounded inline-block p-1 mx-1 text-sm font-mono ${highlight}`}
      >
        {props.tag.trim()}
      </span>
    </Link>
  );
}
