import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const PostPreview = dynamic(() => import("./post-preview"), {
  ssr: false,
  loading: () => null,
});

export default function PostIndexItem({ post }) {
  const [previewActive, setPreviewActive] = useState(false);
  const hasPreview = Boolean(post.preview);
  const previewOffsetClass = post.preview?.type === "image" ? "ml-24" : "ml-16";

  return (
    <div className="my-4">
      <span
        className="relative inline-flex max-w-full items-baseline"
        onMouseEnter={() => setPreviewActive(true)}
        onMouseLeave={() => setPreviewActive(false)}
      >
        <Link
          href={`/blog/${post.id}`}
          locale={post.locale}
          className="text-lg font-normal no-underline hover:text-zinc-500"
          onFocus={() => setPreviewActive(true)}
          onBlur={() => setPreviewActive(false)}
        >
          <span className="font-mono text-zinc-500">{post.date.substring(5)}</span>
          <span className="px-2 text-zinc-400">·</span>
          <span>{post.title}</span>
        </Link>
        {hasPreview && previewActive && (
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute left-full top-1/2 z-20 hidden w-80 -translate-y-1/2 lg:block xl:w-96 ${previewOffsetClass}`}
          >
            <PostPreview preview={post.preview} active={previewActive} />
          </span>
        )}
      </span>
    </div>
  );
}
