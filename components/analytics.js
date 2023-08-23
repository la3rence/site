export default function Umami() {
  return (
    <script
      async
      src={process.env.NEXT_PUBLIC_ANALYTICS_URL}
      data-website-id="3ac93385-5b59-43e3-9b02-01fe09804587"
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
