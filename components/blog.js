import Link from "next/link";
import Layout from "./layout";
import withView from "./withView";
import withLocalization from "./withI18n";
import { useEffect, useState } from "react";
import Tag from "./tag";
import Avatar from "./avatar";
import cfg from "../lib/config.mjs";
import Comments from "./comments";
import mediumZoom from "medium-zoom";
import { useTheme } from "next-themes";

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
    hasGist,
    hasAlert,
  } = props;
  const [replies, setReplies] = useState([]);
  const [likes, setLikes] = useState([]);
  const { resolvedTheme } = useTheme();

  const getReplies = async id => {
    const replies = await (await fetch(`/api/activitypub/reply?id=${id}`)).json();
    setReplies(replies);
  };

  const getLikes = async id => {
    const likes = await (await fetch(`/api/like?id=${id}`)).json();
    setLikes(likes);
  };

  useEffect(() => {
    const fetchActivity = async () => {
      await getReplies(id);
      await getLikes(id);
    };
    fetchActivity();
    mediumZoom(document.querySelectorAll("figure>img"), { background: "rgba(0,0,0,0.3)" });
  }, [id]);

  return (
    <Layout blog {...props} domain={new URL(pageURL).hostname}>
      {hasGist && (
        // eslint-disable-next-line @next/next/no-css-tags
        <link rel="stylesheet" fetchpriority="low" type="text/css" href="/css/gist.css" />
      )}
      {hasGist && resolvedTheme === "dark" && (
        // eslint-disable-next-line @next/next/no-css-tags
        <link rel="stylesheet" fetchpriority="low" type="text/css" href="/css/terminal.css" />
      )}
      {hasAlert && (
        // eslint-disable-next-line @next/next/no-css-tags
        <link rel="stylesheet" fetchPriority="low" type="text/css" href="/css/alert.css" />
      )}
      <article className="blog">
        {!props.noTitle && (
          <h1 id="title" className={`articleTitle text-balance font-medium mb-0 mt-14`}>
            {title}
          </h1>
        )}
        {!props.noMeta && (
          <div className="articleTitle flex items-center" id="meta">
            <div className="flex mt-2 cursor-pointer rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-500 pr-2">
              <Link href={"/"} className="no-underline p-1">
                <div className="flex items-center justify-start flex-wrap not-prose">
                  <Avatar src={`https://github.com/${cfg.github}.png`} size={25} alt={author} />
                  <small className={`ml-2`}>{author}</small>
                  <small className={`before:content-['/'] before:p-0 before:m-2`}>
                    <time dateTime={date}>{date}</time>
                  </small>
                </div>
              </Link>
            </div>
            <div className="flex-1" />
            <div id="views">
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
          <div className="tags mt-10">
            <div>
              {tags && tags.split(",").map(each => <Tag tag={each} key={each} locale={locale} />)}
            </div>
          </div>
          <hr />
          <div className="social">
            {likes?.length > 0 && (
              <>
                <h6 id="like" className="font-bold my-2">
                  {translations["Likes"]} ({likes?.length})
                </h6>
                <div className="mt-2 mr-1 flex">
                  {likes?.map(like => {
                    return (
                      <a
                        href={like.actor}
                        target="_blank"
                        key={like._id}
                        className="not-prose mr-1"
                        rel="noopener noreferrer"
                      >
                        <Avatar
                          src={like.avatar}
                          size={25}
                          alt={like.actor}
                          fallback="/images/mstdn.png"
                        />
                      </a>
                    );
                  })}
                </div>
              </>
            )}
            {!props.noReply && (
              <>
                {/* <h6 id="reply" className="font-bold my-2">
                  {translations["Replies from Fediverse"]}
                  {replies?.length > 0 ? `(${replies?.length})` : ""}
                </h6>*/}
                <div className="mt-4 text-sm">
                  {/* <span>
                    {translations["Search this URL on Mastodon to reply"]}:<code>{pageURL}</code>
                  </span>*/}
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
                                fallback="/images/mstdn.png"
                              />
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
          <div className="comments">
            {cfg.enableGitHubComment && !props.noReply && <Comments />}
            {/* {!props.noReward && (
            <RewardImages text={"Scan the QR Code to leave a tip :)"} />
          )} */}
          </div>
        </>
      )}
    </Layout>
  );
};

export default withView(withLocalization(Blog));
