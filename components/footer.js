import A from "./a";
import config from "../lib/config.mjs";
import { useEffect, useState } from "react";
import { TwitterIcon, GitHubIcon, MailIcon } from "./svg";

const { siteTitle, twitter, github, repo, authorEmail, enableBuildInfo } =
  config;
const BUILDTIME = process.env.NEXT_PUBLIC_BUILDTIME;
const GITSHA = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA; // latest git commit sha provided from vercel

const Footer = () => {
  const [mounted, setMounted] = useState(false);
  const [pageLoadDuration, setPageLoadDuration] = useState(0);

  useEffect(() => {
    setMounted(true);
    setPageLoadDuration(performance.getEntriesByType("navigation")[0].duration);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="mx-4 mt-16 mb-24 text-xs text-center">
      {twitter && (
        <div className="px-1 inline-block">
          <A href={`https://twitter.com/${twitter}`}>
            <TwitterIcon />
          </A>
        </div>
      )}
      {authorEmail && (
        <div className="px-1 inline-block">
          <A href={`mailto:${authorEmail}`}>
            <MailIcon />
          </A>
        </div>
      )}
      {github && (
        <div className="px-1 inline-block">
          <A href={`https://github.com/${github}`}>
            <GitHubIcon />
          </A>
        </div>
      )}
      {enableBuildInfo && (
        <div className="mt-2 text-zinc-500">
          <span className="mx-1 ">
            Built on {new Date(BUILDTIME * 1000).toLocaleString()} ·{" "}
            {Math.floor(pageLoadDuration)} ms ·
          </span>
          <A href={`https://github.com/${github}/${repo}/commit/${GITSHA}`}>
            <span className="font-mono">{GITSHA?.slice(0, 6)}</span>
          </A>
        </div>
      )}
      <div className="mt-0 text-zinc-500">
        <A href="/privacy" self="true">
          <span className="mx-1">Privacy Policy</span>
        </A>
        <span>{new Date().getFullYear()} ©️ </span>
        <A href="/" self="true">
          <span>{siteTitle}</span>
        </A>
      </div>
    </div>
  );
};

// footer component
export default Footer;
