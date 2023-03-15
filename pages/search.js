import Layout from "../components/layout";
import FlexSearch from "flexsearch";
import { useState, useRef, useEffect } from "react";
import { getMdPostsData } from "../lib/ssg.mjs";
import Link from "next/link";

export default function Search({ posts }) {
  const [index, setIndex] = useState();
  const [searchResults, setSearchResults] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const inputRef = useRef();
  useEffect(() => {
    const index = new FlexSearch.Document({
      tokenize: "full",
      document: {
        id: "id",
        index: ["content"],
        store: ["id", "content", "title", "path", "tags", "description"],
      },
    });
    posts.forEach(post => {
      const paragraphs = post.content.split("\n").filter(Boolean); // split full article
      for (let i = 0; i < paragraphs.length; i++) {
        index.add({
          id: `${post.id}?${i}`,
          title: post.title,
          tags: post.tags,
          path: post.path,
          content: paragraphs[i],
        });
      }
      // todo: add all indexes with tags, desciption...
    });
    setIndex(index);
  }, [posts]);

  const search = async () => {
    const keyword = inputRef.current.value;
    setKeywords(keyword);
    const searchResults = index.search(keyword, { enrich: true, bool: "or" });
    console.debug("searchResults", searchResults);
    const results = buildArray(searchResults);
    setSearchResults(results);
    console.debug("results", results);
  };

  return (
    <Layout title={"Search"}>
      <div className="flex mt-20">
        <input
          ref={inputRef}
          type="text"
          onChange={search}
          className="h-12 pl-4 py-3 bg-zinc-100 flex-1 dark:bg-zinc-800 rounded-none outline-none"
        />
      </div>
      {searchResults.map(searchResult => {
        return (
          <div key={searchResult.path}>
            <Link
              href={searchResult.path}
              className="no-underline cursor-pointer"
            >
              <h3>
                <HighlightMatches match={keywords} value={searchResult.title} />
              </h3>
            </Link>
            {searchResult.items.map(item => {
              return (
                <div className="break-words my-1" key={item.id}>
                  <HighlightMatches match={keywords} value={item.content} />
                </div>
              );
            })}
          </div>
        );
      })}
    </Layout>
  );
}

export const getStaticProps = async () => {
  const posts = getMdPostsData();
  posts.forEach(post => {
    post.path = `/blog/${post.id}`;
  });
  return {
    props: {
      posts,
    },
  };
};

function groupByPath(arr) {
  return Object.values(
    arr.reduce((result, item) => {
      result[item.path] = result[item.path] || {
        title: item.title,
        path: item.path,
        items: [],
      };
      result[item.path].items.push(item);
      return result;
    }, {})
  );
}

function buildArray(originalArray) {
  let temp = [];
  for (let i = 0; i < originalArray.length; i++) {
    const searchObj = originalArray[i];
    const results = searchObj?.result;
    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      const resultDoc = result.doc;
      temp.push(resultDoc);
    }
  }
  temp.sort((a, b) => a.id.localeCompare(b.id));
  return groupByPath(temp);
}

import { Fragment, memo } from "react";

const HighlightMatches = memo(function HighlightMatches({ value, match }) {
  const splitText = value ? value.split("") : [];
  const escapedSearch = match.trim().replace(/[|\\{}()[\]^$+*?.]/g, "\\$&");
  const regexp = RegExp("(" + escapedSearch.replaceAll(" ", "|") + ")", "ig");
  let result;
  let id = 0;
  let index = 0;
  const res = [];

  if (value) {
    while ((result = regexp.exec(value)) !== null) {
      res.push(
        <Fragment key={id++}>
          {splitText.splice(0, result.index - index).join("")}
          <span className="bg-orange-500">
            {splitText.splice(0, regexp.lastIndex - result.index).join("")}
          </span>
        </Fragment>
      );
      index = regexp.lastIndex;
    }
  }
  return (
    <span className="mx-4">
      {res}
      {splitText.join("")}
    </span>
  );
});
