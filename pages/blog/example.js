import Blog from "../../components/blog";
import Image from "next/image";
import cfg from "../../lib/config.mjs";
import Bilibili from "../../components/bilibili";
import Douban from "../../components/douban";
import GitHub from "../../components/github";
import demoPic from "../../public/images/the1975.jpg";

export const blogProps = {
  author: cfg.authorName,
  title: "Example",
  date: "2022-08-26",
  someKey: "someValeInJSXProps",
  tags: "example, test, jsx",
  visible: true,
};

/**
 * This is an example blog page written with React component.
 * You can use any client side React component in it.
 */
export default function Example() {
  return (
    <Blog {...blogProps}>
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
