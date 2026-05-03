import Link from "next/link";
import dynamic from "next/dynamic";
import Layout from "./layout";
import withLocalization from "./withI18n";
import { useRef, useEffect } from "react";
import Tag from "./tag";
import Avatar from "./avatar";
import cfg from "../lib/config.mjs";
import { useTheme } from "next-themes";

const ArticleImageZoom = dynamic(() => import("./article-image-zoom"), {
  ssr: false,
});
const ArticleViewCount = dynamic(() => import("./article-view-count"), {
  ssr: false,
});
const ArticleSocial = dynamic(() => import("./article-social"), { ssr: false });
const ArticleActions = dynamic(() => import("./article-actions"), { ssr: false });

// Non-blocking CSS loader — avoids render-blocking stylesheet fetch
const loadCSS = href => {
  const existing = document.querySelector(`link[href="${href}"]`);
  if (existing) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.media = "print";
  link.onload = () => {
    link.media = "all";
  };
  document.head.appendChild(link);
};

const removeCSS = href => {
  const link = document.querySelector(`link[href="${href}"]`);
  if (link) link.remove();
};

const Blog = props => {
  const {
    children,
    title,
    date,
    author,
    id,
    tags,
    image,
    i18n,
    locale,
    translations,
    hasGist,
    hasAlert,
  } = props;
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (hasAlert) loadCSS("/css/alert.css");
  }, [hasGist, hasAlert]);

  useEffect(() => {
    if (hasGist) {
      loadCSS("/css/gist.css");
      if (resolvedTheme === "dark") {
        loadCSS("/css/terminal.css");
      } else {
        removeCSS("/css/terminal.css");
      }
    }
  }, [hasGist, resolvedTheme]);
  const articleRef = useRef(null);

  return (
    <Layout blog {...props}>
      <article className="blog" ref={articleRef}>
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
              <ArticleViewCount translations={translations} />
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
        <ArticleImageZoom containerRef={articleRef} contentKey={`${id}:${locale}`} />
      </article>
      {!props.noMeta && (
        <>
          <div className="tags mt-10">
            <div>
              {tags && tags.split(",").map(each => <Tag tag={each} key={each} locale={locale} />)}
            </div>
          </div>
          <hr />
          <ArticleActions translations={translations} />
          <ArticleSocial translations={translations} noReply={props.noReply} />
        </>
      )}
    </Layout>
  );
};

export default withLocalization(Blog);
