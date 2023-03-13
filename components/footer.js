import A from "./a";
import config from "../lib/config.mjs";
import { useEffect, useState } from "react";
import { TwitterIcon, GitHubIcon, MailIcon } from "./svg";

let { siteTitle, twitter, github, authorEmail } = config;

const Footer = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="mx-4 mt-16 mb-24 text-sm text-center">
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
    </div>
  );
};

// footer component
export default Footer;
