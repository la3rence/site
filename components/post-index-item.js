import Link from "next/link";

export default function PostIndexItem({ post }) {
  return (
    <div className="my-4">
      <Link
        href={`/blog/${post.id}`}
        locale={post.locale}
        className="text-lg font-normal no-underline hover:text-zinc-500"
      >
        <span className="font-mono text-zinc-500">{post.date.substring(5)}</span>
        <span className="px-2 text-zinc-400">·</span>
        <span>{post.title}</span>
      </Link>
    </div>
  );
}
