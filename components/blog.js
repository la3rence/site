/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import Layout from "./layout";
import withView from "./withView";
import { useEffect, useState } from "react";
import "highlight.js/styles/sunburst.css";
import "gist-syntax-themes/stylesheets/one-dark.css";
import Tag from "./tag";
import Avatar from "./avatar";
import RewardImages from "./reward";

export default withView(props => {
  const { children, title, date, author, view, id, tags, pageURL, themeColor } =
    props;
  const [replies, setReplies] = useState([]);
  const [likes, setLikes] = useState([]);

  useEffect(() => {
    getReplies(id);
    getLikes(id);
  }, [id]);

  const getReplies = async id => {
    const replies = await (
      await fetch(`/api/activitypub/reply?id=${id}`)
    ).json();
    setReplies(replies);
  };

  const getLikes = async id => {
    const likes = await (await fetch(`/api/like?id=${id}`)).json();
    setLikes(likes);
  };

  return (
    <Layout blog {...props} domain={new URL(pageURL).hostname}>
      <article className="blog">
        {!props.noTitle && (
          <h1 id="title" className="articleTitle cursor-pointer mt-28">
            <a href={`#title`} className={`text-[${themeColor}] no-underline`}>
              {title}
            </a>
          </h1>
        )}
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
                  <Avatar
                    src={"https://avatars.githubusercontent.com/u/24540598"}
                    size={25}
                    alt={author}
                  />
                  <small className="ml-2">{author}</small>
                  <small className="before:content-['/'] before:p-0 before:m-2">
                    <time dateTime={date}>{date}</time>
                  </small>
                </div>
              </Link>
            </div>
            <div className="flex-1" />
            <div className="justify-end" id="views">
              {view > 0 && <small>{view} views</small>}
            </div>
          </div>
        )}
        <div className="article">{children}</div>
      </article>
      {!props.noMeta && (
        <>
          <div className="mx-2 mt-10">
            <div>
              {tags &&
                tags.split(",").map(each => <Tag tag={each} key={each} />)}
            </div>
          </div>
          <hr />
          <div>
            {likes?.length > 0 && (
              <>
                <h4 id="like">Likes ({likes?.length})</h4>
                <div className="mx-4 mt-2 mr-1 flex">
                  {likes?.map(like => {
                    return (
                      <a
                        href={like.actor}
                        target="_blank"
                        key={like._id}
                        className="not-prose mr-1"
                      >
                        <Avatar src={like.avatar} size={25} alt={like.actor} />
                      </a>
                    );
                  })}
                </div>
              </>
            )}
            {!props.noReply && (
              <>
                <h4 id="reply">
                  Replies {replies?.length > 0 ? `(${replies?.length})` : ""}
                </h4>
                <div className="mx-4 mt-4 text-sm">
                  <span>Search this URL on mastodon to reply:</span>
                  <div className="font-mono my-4 break-words">{pageURL}</div>
                  <div className="mt-6">
                    {replies?.map(reply => {
                      return (
                        <div key={reply.url} className="mt-1">
                          <div className="flex">
                            <span className="mr-2 not-prose">
                              <Avatar
                                src={reply.avatar}
                                size={25}
                                alt={reply.account}
                              />
                            </span>
                            <a
                              href={reply.url}
                              target="_blank"
                              className="no-underline hover:underline"
                            >
                              <span className="h-6 leading-6">
                                {reply.account} commented:
                              </span>
                            </a>
                          </div>
                          <span
                            dangerouslySetInnerHTML={{ __html: reply.content }}
                          ></span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
          {!props.noReward && (
            <RewardImages text={"Scan the QR Code to leave a tip :)"} />
          )}
        </>
      )}
    </Layout>
  );
});
