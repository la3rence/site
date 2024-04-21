import { ImageResponse } from "@vercel/og";
import siteConfig from "../../lib/config.mjs";

async function fetchFont(text, font) {
  const API = `https://fonts.googleapis.com/css2?family=${font}&text=${encodeURIComponent(
    text + "●▲■",
  )}`;
  const css = await (
    await fetch(API, {
      headers: {
        // Make sure it returns TTF.
        "User-Agent":
          "Mozilla/5.0 (BB10; Touch) AppleWebKit/537.1+ (KHTML, like Gecko) Version/10.0.0.1337 Mobile Safari/537.1+",
      },
    })
  ).text();
  const resource = css.match(/src: url\((.+)\) format\('(opentype|truetype)'\)/);
  if (!resource) return null;
  const res = await fetch(resource[1]);
  return res.arrayBuffer();
}

export const config = {
  runtime: "edge",
};

export default async function opengraph(request) {
  const { searchParams } = new URL(request.url);
  const meta = searchParams.get("meta");
  const title = meta?.split(",")[0];
  const color = meta?.split(",")[1];
  const notoSansScFont = await fetchFont(title, "Noto+Sans+SC");
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          backgroundColor: `${color && color !== "undefined" ? `#${color}` : "#121212"}`,
        }}
      >
        <div tw="ml-12 flex text-zinc-200">
          <div tw="flex flex-col w-full py-12 px-4 justify-between p-6">
            <span tw="mt-16 text-7xl">
              ■ <span tw="text-3xl pt-5 pl-3">{siteConfig.domain}</span>
            </span>
            <h1 tw="mb-18 flex flex-col text-left ">
              <span tw="text-7xl font-bold">● {title}</span>
              {/* <span tw="text-3xl mt-3">{siteConfig.siteTitle}</span> */}
            </h1>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Noto Sans SC",
          data: notoSansScFont,
          style: "normal",
        },
      ],
    },
  );
}
