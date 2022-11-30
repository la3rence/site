import Link from "next/link";

export default function Tag(props) {
  const highlight = props.highlight
    ? "bg-zinc-200 dark:bg-zinc-800"
    : "hover:bg-zinc-200 ";
  return (
    <Link
      href={`/tag/${props.tag.toLowerCase().trim()}`}
      className="no-underline"
    >
      <span
        className={`duration-100 transition rounded inline-block p-1 mx-1 text-sm font-mono ${highlight}`}
      >
        #{props.tag.trim()}
      </span>
    </Link>
  );
}
