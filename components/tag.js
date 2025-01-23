import Link from "next/link";

export default function Tag(props) {
  const highlight = props.highlight
    ? "bg-zinc-200 dark:bg-zinc-600"
    : "hover:bg-zinc-200 dark:hover:bg-zinc-600";
  return (
    <Link
      href={`/tag/${props.tag.toLowerCase().trim()}`}
      className="no-underline"
      locale={props.locale}
    >
      <span
        className={`before:content-['#'] duration-100 transition rounded-sm inline-block p-1 mr-1 text-sm font-mono ${highlight}`}
      >
        {props.tag.trim()}
      </span>
    </Link>
  );
}
