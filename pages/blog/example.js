import Blog from "../../components/blog";
import Image from "next/image";
import config from "../../lib/config.mjs";
import Bilibili from "../../components/bilibili";
import Douban from "../../components/douban";
import GitHub from "../../components/github";
import demoPic from "../../public/images/the1975.jpg";
import Pixi from "../../components/pixi";

export const blogProps = {
  author: config.authorName,
  title: "Example",
  date: "2022-08-26",
  someKey: "someValeInJSXProps",
  tags: "Example, Test, Video, Douban",
  visible: true,
};

export default function Example() {
  return (
    <Blog {...blogProps}>
      <Pixi></Pixi>
      <p>
        This page is fully rendered by <code>JSX</code>. You can update this
        page with JavaScript and React components.
      </p>
      <p>
        Image example: <code>{"<Image />"}</code>
      </p>
      <div className="filter dark:brightness-75 ">
        <Image src={demoPic} alt={"Demo image"} />
      </div>
      <p>Movie example: (CSR)</p>
      <Douban id="3205624" />
      <p>GitHub Repo Example: (CSR)</p>
      <GitHub user="vercel" repo="next.js" />
      <p>Video example:</p>
      <Bilibili bv="BV1ys411a7Wu" />
      <br className="mt-4" />
    </Blog>
  );
}
