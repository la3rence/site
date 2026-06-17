import Script from "next/script";
import config from "../lib/config.mjs";

export default function Umami() {
  return (
    <Script
      id="umami-analytics"
      src="/insight/script.js"
      strategy="lazyOnload"
      data-website-id={config.analyticsWebsiteId}
    />
  );
}

export const Adsense = () => {
  if (!config.enableAdsense) {
    return null;
  }

  return (
    <Script id="adsense" src={config.adsenseURL} strategy="lazyOnload" crossOrigin="anonymous" />
  );
};
