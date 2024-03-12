export default function Umami() {
  return (
    <script
      async
      src={process.env.NEXT_PUBLIC_ANALYTICS_URL}
      data-website-id={process.env.NEXT_PUBLIC_ANALYTICS_ID}
    ></script>
  );
}

export const Adsense = () => (
  <script
    async
    src={process.env.NEXT_PUBLIC_ADS_URL}
    crossOrigin="anonymous"
  ></script>
);
