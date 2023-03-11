import Layout from "../components/layout";
import { useState, useRef } from "react";
import Link from "next/link";

export default function Search() {
  const [results, setResults] = useState([]);
  const inputRef = useRef();
  const timeoutId = useRef();

  const search = async () => {
    const keyword = inputRef.current.value;
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }
    timeoutId.current = setTimeout(async () => {
      if (keyword) {
        const res = await fetch(`/api/search?q=${keyword}`);
        const data = await res.json();
        setResults(data);
      }
    }, 500); // 延迟时间为 500ms
  };

  return (
    <Layout title={"Search"}>
      <div className="flex mt-20">
        <input
          ref={inputRef}
          type="text"
          onInput={search}
          className="h-12 pl-4 py-3 bg-zinc-100 flex-1 dark:bg-zinc-800 rounded-none outline-none"
        />
      </div>
      {results.length > 0 && (
        <>
          {results.map(post => {
            return (
              <div key={post.id}>
                <h3>
                  <Link href={`/blog/${post.id}`}>{post.title}</Link>
                </h3>
                <p
                  className="break-words"
                  dangerouslySetInnerHTML={{ __html: post.contexts }}
                ></p>
              </div>
            );
          })}
        </>
      )}
    </Layout>
  );
}
