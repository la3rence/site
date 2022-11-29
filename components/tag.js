import Link from "next/link";

export default function Tag(props) {
  return (
    <>
      <Link
        href={`/tag/${props.tag.toLowerCase().trim()}`}
        className="no-underline"
      >
        <span className="rounded p-1 mx-1 text-sm dark:bg-zinc-800 bg-zinc-100">
          {props.tag.trim()}
        </span>
      </Link>
    </>
  );
}
