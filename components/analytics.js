export default function Umami() {
  return (
    <script
      async
      src={process.env.NEXT_PUBLIC_ANALYTICS_URL}
      fetchpriority="low"
      data-website-id={process.env.NEXT_PUBLIC_ANALYTICS_ID}
    ></script>
  );
}

export const Adsense = () => (
  <script
    async
    src={process.env.NEXT_PUBLIC_ADS_URL}
    fetchpriority="low"
    crossOrigin="anonymous"
  ></script>
);
