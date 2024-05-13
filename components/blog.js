/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import Layout from "./layout";
import withView from "./withView";
import withLocalization from "./withI18n";
import { useEffect, useState } from "react";
import "highlight.js/styles/sunburst.css";
import "gist-syntax-themes/stylesheets/one-dark.css";
import Tag from "./tag";
import Avatar from "./avatar";
import cfg from "../lib/config.mjs";
import Disqus from "./disqus";
import Comments from "./comments";

const Blog = props => {
  const {
    children,
    title,
    date,
    author,
    view,
    id,
    tags,
    pageURL,
    image,
    i18n,
    locale,
    translations,
  } = props;
  const [replies, setReplies] = useState([]);
  const [likes, setLikes] = useState([]);

  useEffect(() => {
    getReplies(id);
    getLikes(id);
  }, [id]);

  const getReplies = async id => {
    const replies = await (await fetch(`/api/activitypub/reply?id=${id}`)).json();
    setReplies(replies);
  };

  const getLikes = async id => {
    const likes = await (await fetch(`/api/like?id=${id}`)).json();
    setLikes(likes);
  };

  const withImageMargin = image ? "sm:-mt-28 -mt-32" : "mt-28";
  const withImageColor = image ? "text-zinc-50" : "";

  return (
    <Layout blog {...props} domain={new URL(pageURL).hostname}>
      <article className="blog">
        {!props.noTitle && (
          <h1
            id="title"
            className={`articleTitle text-balance font-medium mb-0 ${withImageMargin} ${withImageColor}`}
          >
            {title}
          </h1>
        )}
        {!props.noMeta && (
          <div className="articleTitle flex justify-start items-center flex-wrap mt-1" id="meta">
            <div
              className="flex flex-2 items-center justify-center cursor-pointer rounded-lg
           hover:bg-zinc-300 hover:bg-opacity-20 pr-2"
            >
              <Link href={"/"} className="no-underline p-1">
                <div className="flex items-center justify-start flex-wrap not-prose">
                  <Avatar src={`https://github.com/${cfg.github}.png`} size={25} alt={author} />
                  <small className={`ml-2 ${withImageColor}`}>{author}</small>
                  <small className={`before:content-['/'] before:p-0 before:m-2 ${withImageColor}`}>
                    <time dateTime={date}>{date}</time>
                  </small>
                </div>
              </Link>
            </div>
            <div className="flex-1" />
            <div className={`${withImageColor}`} id="views">
              {view > 10 && (
                <small>
                  {view} {translations["views"]}
                </small>
              )}
            </div>
            {i18n?.length > 1 && (
              <div className="justify-end ml-2" id="i18n">
                {i18n
                  .filter(language => language !== locale)
                  .map(language => {
                    return (
                      <Link
                        className="mr-2 no-underline"
                        key={language}
                        href={id}
                        locale={language}
                      >
                        <span>
                          <span className="text-sm hover:font-semibold">
                            {language?.toUpperCase()}
                          </span>
                        </span>
                      </Link>
                    );
                  })}
              </div>
            )}
          </div>
        )}
        <div className="article mt-6">
          {image && <div className="h-4"></div>}
          {children}
        </div>
      </article>
      {!props.noMeta && (
        <>
          <div className="mx-2 mt-10">
            <div>
              {tags && tags.split(",").map(each => <Tag tag={each} key={each} locale={locale} />)}
            </div>
          </div>
          <hr />
          <div>
            {likes?.length > 0 && (
              <>
                <h4 id="like">
                  {translations["Likes"]} ({likes?.length})
                </h4>
                <div className="mx-4 mt-2 mr-1 flex">
                  {likes?.map(like => {
                    return (
                      <a
                        href={like.actor}
                        target="_blank"
                        key={like._id}
                        className="not-prose mr-1"
                        rel="noopener noreferrer"
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
                  {translations["Replies from Fediverse"]}
                  {replies?.length > 0 ? `(${replies?.length})` : ""}
                </h4>
                <div className="mx-4 mt-4 text-sm">
                  <span>{translations["Search this URL on Mastodon to reply"]}:</span>
                  <div className="font-mono my-4 break-words">{pageURL}</div>
                  <div className="mt-6">
                    {replies?.map(reply => {
                      return (
                        <div key={reply.url} className="mt-1">
                          <div className="flex">
                            <span className="mr-2 not-prose">
                              <Avatar src={reply.avatar} size={25} alt={reply.account} />
                            </span>
                            <a
                              href={reply.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="no-underline hover:underline"
                            >
                              <span className="h-6 leading-6">
                                {reply.account} {translations["commented"]}:
                              </span>
                            </a>
                          </div>
                          <span dangerouslySetInnerHTML={{ __html: reply.content }}></span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
          {cfg.enableDisqus && !props.noReply && (
            <Disqus url={pageURL} identifier={id} title={title} />
          )}
          {cfg.enableGitHubComment && !props.noReply && <Comments />}
          {/* {!props.noReward && (
            <RewardImages text={"Scan the QR Code to leave a tip :)"} />
          )} */}
        </>
      )}
    </Layout>
  );
};

export default withView(withLocalization(Blog));
