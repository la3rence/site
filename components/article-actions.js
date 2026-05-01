import { useState, useEffect, useCallback } from "react";
import RewardImages from "./reward";
import cfg from "../lib/config.mjs";

export default function ArticleActions({ translations }) {
  const [showReward, setShowReward] = useState(false);
  const close = useCallback(() => setShowReward(false), []);

  useEffect(() => {
    if (!showReward) return;
    const onKey = e => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showReward, close]);

  const onBackdropClick = e => {
    if (e.target === e.currentTarget) close();
  };

  return (
    <>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
        }
      `}</style>
      <div className="flex justify-center gap-2 mt-10 mb-8 not-prose">
        <a
          href={`mailto:${cfg.authorEmail}`}
          className="no-underline text-sm hover:animate-[shake_0.3s_ease-in-out]"
        >
          {translations["Write Me"]}
        </a>
        <button
          onClick={() => setShowReward(true)}
          className="no-underline text-sm cursor-pointer bg-transparent text-inherit border-0 p-0 hover:animate-[shake_0.3s_ease-in-out]"
        >
          {translations["Tip Me"]}
        </button>
      </div>

      {showReward && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={onBackdropClick}
        >
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 max-w-sm w-full mx-4 relative">
            <button
              onClick={close}
              className="absolute top-3 right-5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 text-3xl leading-none cursor-pointer bg-transparent border-none"
              aria-label="Close"
            >
              &times;
            </button>
            <h3 className="text-center text-lg font-medium mb-0">
              {translations["Support My Work"]}
            </h3>
            <RewardImages translations={translations} />
          </div>
        </div>
      )}
    </>
  );
}
