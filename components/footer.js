import A, { Icon } from "./a";
import config from "../lib/config.mjs";
import { useEffect, useState } from "react";

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
    <div className="mx-4 mt-16 mb-24 text-sm text-gray-400 text-center">
      <Icon network="twitter" url={`https://twitter.com/${twitter}`} />
      <Icon network="email" url={`mailto:${authorEmail}`} />
      <Icon network="github" url={`https://github.com/${github}`} />
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
