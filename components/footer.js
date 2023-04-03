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

  useEffect(() => {
    setMounted(true);
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
      <div className="mt-2">
        <A href="/" self="true">
          {new Date().getFullYear()} ©️{" "}
          <span className="underline hover:text-zinc-500">{siteTitle}</span>
        </A>
      </div>
      {enableBuildInfo && (
        <div className="mt-2">
          <span className="mx-1 text-zinc-500 dark:text-zinc-600">
            Built on {new Date(BUILDTIME * 1000).toLocaleString()}
          </span>
          <A href={`https://github.com/${github}/${repo}/commit/${GITSHA}`}>
            <span className="font-mono text-zinc-500 dark:text-zinc-600">
              {GITSHA?.slice(0, 6)}
            </span>
          </A>
        </div>
      )}
    </div>
  );
};

// footer component
export default Footer;
