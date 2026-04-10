import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import Avatar from "./avatar";
import cfg from "../lib/config.mjs";

const Comments = dynamic(() => import("./comments"), {
  ssr: false,
});

const getRoutePath = asPath => {
  return asPath.split("?")[0].split("#")[0];
};

export default function ArticleSocial({ translations, noReply }) {
  const containerRef = useRef(null);
  const router = useRouter();
  const [isActive, setIsActive] = useState(false);
  const [replies, setReplies] = useState([]);
  const [likes, setLikes] = useState([]);

  useEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setIsActive(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px 0px" },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const routePath = getRoutePath(router.asPath);
    let disposed = false;

    const fetchSocial = async () => {
      try {
        const [replyRes, likeRes] = await Promise.all([
          fetch(`/api/activitypub/reply?id=${routePath}`),
          fetch(`/api/like?id=${routePath}`),
        ]);

        if (!replyRes.ok || !likeRes.ok) {
          throw new Error(`social fetch failed: ${replyRes.status}/${likeRes.status}`);
        }

        const [replyData, likeData] = await Promise.all([replyRes.json(), likeRes.json()]);

        if (disposed) {
          return;
        }

        setReplies(Array.isArray(replyData) ? replyData : []);
        setLikes(Array.isArray(likeData) ? likeData : []);
      } catch (error) {
        if (!disposed) {
          setReplies([]);
          setLikes([]);
        }
        console.warn("article social fetch failed", routePath, error);
      }
    };

    fetchSocial();

    return () => {
      disposed = true;
    };
  }, [isActive, router.asPath]);

  return (
    <div ref={containerRef}>
      <div className="social">
        {likes?.length > 0 && (
          <>
            <h6 id="like" className="font-bold my-2">
              {translations["Likes"]} ({likes.length})
            </h6>
            <div className="mt-2 mr-1 flex">
              {likes.map(like => {
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
        {!noReply && (
          <div className="mt-4 text-sm">
            <div className="mt-6">
              {replies.map(reply => {
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
        )}
      </div>
      <div className="comments">
        {isActive && cfg.enableGitHubComment && !noReply && <Comments />}
      </div>
    </div>
  );
}
