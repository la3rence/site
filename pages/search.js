import Layout from "../components/layout";
import FlexSearch from "flexsearch";
import { useState, useRef, useEffect, useMemo } from "react";
import { getMdPostsData } from "../lib/ssg.mjs";
import Link from "next/link";

export default function Search({ posts }) {
  const [results, setResults] = useState([]);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  const index = useMemo(() => {
    const idx = new FlexSearch.Document({
      tokenize: "forward",
      document: {
        id: "id",
        index: ["title", "content", "tags"],
        store: ["title", "path", "content"],
      },
    });
    posts.forEach(post => {
      idx.add({
        id: post.id,
        title: post.title,
        tags: post.tags || "",
        path: post.path,
        content: post.content,
      });
    });
    return idx;
  }, [posts]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const search = () => {
    const q = inputRef.current?.value || "";
    setQuery(q);
    if (!q.trim() || !index) {
      setResults([]);
      return;
    }
    const raw = index.search(q, { enrich: true, limit: 20 });

    const merged = new Map();
    raw.forEach(field => {
      field.result?.forEach(r => {
        if (!merged.has(r.id)) {
          merged.set(r.id, r.doc);
        }
      });
    });

    setResults([...merged.values()]);
  };

  return (
    <Layout title="Search">
      <div className="flex my-20 justify-center">
        <input
          ref={inputRef}
          type="text"
          onChange={search}
          placeholder="Search..."
          className="h-12 pl-4 py-3 bg-zinc-100 flex-1 dark:bg-zinc-800 rounded-none outline-hidden max-w-3xl"
        />
      </div>

      {query && results.length === 0 && (
        <p className="text-zinc-400 dark:text-zinc-500">No results.</p>
      )}

      {results.map(post => (
        <div key={post.id} className="mb-8">
          <Link href={post.path} className="no-underline cursor-pointer">
            <h2>
              <Highlight text={post.title} query={query} />
            </h2>
          </Link>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-3 wrap-break-words">
            <Snippet text={post.content} query={query} />
          </p>
        </div>
      ))}
    </Layout>
  );
}

export const getStaticProps = async () => {
  const posts = getMdPostsData();
  posts.forEach(post => {
    post.path = `/blog/${post.id}`;
  });
  return { props: { posts } };
};

function Highlight({ text, query }) {
  if (!query || !text) return text;

  const words = buildWords(query);
  if (!words) return text;

  return markParts(text, words);
}

function Snippet({ text, query }) {
  if (!text || !query) return text?.slice(0, 150);

  const words = buildWords(query);
  if (!words) return text.slice(0, 150);

  const re = new RegExp(words, "ig");
  const match = re.exec(text);

  if (!match) return text.slice(0, 150);

  const start = Math.max(0, match.index - 60);
  const end = Math.min(text.length, match.index + match[0].length + 80);
  const snippet =
    (start > 0 ? "..." : "") + text.slice(start, end) + (end < text.length ? "..." : "");

  return <Highlight text={snippet} query={query} />;
}

function buildWords(query) {
  return query
    .trim()
    .replace(/[|\\{}()[\]^$+*?.]/g, "\\$&")
    .replace(/\s+/g, "|");
}

function markParts(text, words) {
  const splitRe = new RegExp(`(${words})`, "ig");
  const testRe = new RegExp(`^(${words})$`, "i");

  return text
    .split(splitRe)
    .map((part, i) => (testRe.test(part) ? <mark key={i}>{part}</mark> : part));
}
