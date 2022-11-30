import Blog from "../../components/blog";
import Image from "next/image";
import config from "../../lib/config.json";
import Bilibili from "../../components/bilibili";
import Douban from "../../components/douban";
import demoPic from "../../public/images/the1975.jpg";

export const blogProps = {
  author: config.authorName,
  title: "Example",
  date: "2022-08-26",
  someKey: "someValeInJSXProps",
  tag: "Example, Test, Video, Douban",
};

export default function Example() {
  return (
    <Blog {...blogProps}>
      <p>
        This page is fully rendered by <code>JSX</code>. You can update this
        page with JavaScript and React components.
      </p>
      <p>Image example:</p>
      <div className="filter dark:brightness-75 ">
        <Image src={demoPic} alt={"Demo image"} />
      </div>
      <p>Movie example:</p>
      <Douban id="3205624" />
      <p>Video example:</p>
      <Bilibili bv="BV1ys411a7Wu" />
      <br className="mt-4" />
    </Blog>
  );
}
