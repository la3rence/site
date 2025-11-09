import A from "./a";
import config from "../lib/config.mjs";
import { useEffect, useState } from "react";
import { TwitterIcon, GitHubIcon, MailIcon } from "./svg";
import withLocalization from "./withI18n";

const { siteTitle, twitter, github, repo, authorEmail, enableBuildInfo } = config;
const BUILDTIME = process.env.NEXT_PUBLIC_BUILDTIME;
const GITSHA = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA; // latest git commit sha provided from vercel

const Footer = ({ translations }) => {
  const [mounted, setMounted] = useState(false);
  const [pageRequestDuration, setPageRequestDuration] = useState(0);

  useEffect(() => {
    if (!enableBuildInfo) return;
    const init = async () => {
      setMounted(true);
      const pnt = performance.getEntriesByType("navigation")[0];
      setPageRequestDuration(pnt.responseEnd - pnt.startTime);
    };
    init();
  }, []);

  if (enableBuildInfo && !mounted) {
    return null;
  }

  return (
    <footer className="text-sm mx-4 mt-16 mb-24 text-center">
      {enableBuildInfo && (
        <div className="mt-2">
          <span className="mx-1 ">
            Built on {new Date(BUILDTIME * 1000).toLocaleString()} ·{" "}
            {Math.floor(pageRequestDuration)} ms ·
          </span>
          <A href={`https://github.com/${github}/${repo}/commit/${GITSHA}`}>
            <span className="font-mono">{GITSHA?.slice(0, 6)}</span>
          </A>
        </div>
      )}
      <address>
        <ul className="mt-2 ">
          {twitter && (
            <li className="px-2 inline-block">
              <A href={`https://twitter.com/${twitter}`}>
                <TwitterIcon />
              </A>
            </li>
          )}
          {authorEmail && (
            <li className="px-2 inline-block">
              <A href={`mailto:${authorEmail}`}>
                <MailIcon />
              </A>
            </li>
          )}
          {github && (
            <li className="px-2 inline-block">
              <A href={`https://github.com/${github}`}>
                <GitHubIcon />
              </A>
            </li>
          )}
        </ul>
      </address>
      <div className="mt-0">
        <A href="/privacy" self="true">
          <span className="mr-1">{translations["Privacy"]}</span>
        </A>
        ·{" "}
        <A href="https://status.lawrenceli.me/">
          <span className="mr-1">{translations["Status"]}</span>
        </A>
        · <span>{new Date().getFullYear()} ©️ </span>
        <A href="/" self="true">
          <span>{siteTitle}</span>
        </A>
      </div>
    </footer>
  );
};

// footer component
export default withLocalization(Footer);
