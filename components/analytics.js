import Script from "next/script";

export default function Umami() {
  return (
    <Script
      id="umami-analytics"
      src="/insight/script.js"
      strategy="lazyOnload"
      data-website-id={process.env.NEXT_PUBLIC_ANALYTICS_ID}
    />
  );
}

export const Adsense = () => {
  if (!process.env.NEXT_PUBLIC_ADS_URL) {
    return null;
  }

  return (
    <Script
      id="adsense"
      src={process.env.NEXT_PUBLIC_ADS_URL}
      strategy="lazyOnload"
      crossOrigin="anonymous"
    />
  );
};
