import Image from "next/image";
import Link from "next/link";
import Layout from "./layout";
import withView from "./withView";
import { useEffect, useState } from "react";
import "highlight.js/styles/github-dark.css";
import config from "../lib/config.mjs";
import Tag from "./tag";

export default withView(props => {
  const { children, title, date, author, view, id, tags, pageURL } = props;
  const [like, setLike] = useState(0);
  const [likeFlag, setLikeFlag] = useState(false);
  const [replies, setReplies] = useState([]);

  useEffect(() => {
    getLikes(id);
    getReplies(id);
    setLikeFlag(!!localStorage.getItem(`like:${id}`));
  }, [id]);

  const getReplies = async id => {
    const replies = await (
      await fetch(`/api/activitypub/reply?id=${id}`)
    ).json();
    setReplies(replies);
  };

  const getLikes = async id => {
    const res = await (await fetch(`/api/like?page=${id}`)).json();
    setLike(res.likeCount);
  };

  const addLike = async () => {
    if (!likeFlag) {
      const res = await (
        await fetch(`/api/like?page=${id}`, {
          method: "POST",
        })
      ).json();
      setLike(res.likeCount);
      setLikeFlag(true);
      localStorage.setItem(`like:${id}`, true);
      console.debug(`page: ${id} like: ${res.likeCount}`);
    }
  };

  return (
    <Layout blog {...props} domain={new URL(pageURL).hostname}>
      <div className="blog">
        <h1 id="title" className="articleTitle cursor-pointer mt-28">
          <a href={`#title`} className="no-underline">
            {title}
          </a>
        </h1>
        {!props.noMeta && (
          <div
            className="articleTitle flex justify-start items-center flex-wrap mb-8"
            id="meta"
          >
            <div
              className="flex flex-2 items-center justify-center cursor-pointer rounded-lg
           hover:bg-gray-300 dark:hover:bg-gray-700 dark:text-gray-300 pr-2"
            >
              <Link href={"/"} className="no-underline p-1">
                <div className="flex items-center justify-start flex-wrap not-prose">
                  <Image
                    className="rounded-full"
                    src={`/images/author/${author}.png`}
                    width={25}
                    height={25}
                    alt={author}
                  />
                  <small className="ml-2">{author}</small>
                  <small className="before:content-['/'] before:p-0 before:m-2">
                    {date}
                  </small>
                </div>
              </Link>
            </div>
            <div className="flex-1" />
            <div className="justify-end">
              {view > 0 && <small>{view} views</small>}
            </div>
          </div>
        )}
        <div className="article">{children}</div>
      </div>
      {!props.noMeta && (
        <div className="mx-2 mt-10 mb-5 flex flex-nowrap">
          <div className="flex-1" id="like">
            {config.enableLike && (
              <button
                className={`${
                  likeFlag ? "bg-yellow-300 dark:bg-zinc-700" : ""
                } w-14 text-sm p-1 border-yellow-300 rounded-lg hover:bg-yellow-200 dark:hover:bg-gray-600 transition duration-300`}
                onClick={addLike}
              >
                👍 {like > 0 && like}
              </button>
            )}
          </div>
          <div id="tags">
            {tags && tags.split(",").map(each => <Tag tag={each} key={each} />)}
          </div>
        </div>
      )}
      <hr className="my-0" />
      <div>
        <h4 id="reply">
          Replies {replies.length > 0 ? `(${replies.length})` : ""}
        </h4>
        <div className="mx-4 mt-4 text-sm">
          <span>Search this URL on mastodon to reply:</span>
          <div className="font-mono my-4 break-words">{pageURL}</div>
          <div className="mt-6">
            {replies.map(reply => {
              return (
                <div key={reply.url} className="mt-1">
                  <div>
                    <a
                      href={reply.url}
                      target="_blank"
                      className="no-underline hover:underline"
                    >
                      {reply.account}{" "}
                      <span>
                        replied at {new Date(reply.published).toLocaleString()}:
                      </span>
                    </a>
                    <span
                      dangerouslySetInnerHTML={{ __html: reply.content }}
                    ></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
});
