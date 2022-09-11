import Blog from "../../components/blog";
import Image from "next/image";
import config from "./../../lib/config.json";
import Bilibili from "../../components/bilibili";

export const blogProps = {
  author: config.authorName,
  title: "SSG Example",
  date: "2022-08-26",
  someKey: "someValeInJSXProps",
};

export default function Example() {
  return (
    <Blog {...blogProps}>
      <p>
        This page is fully rendered by <code>JSX</code>. You can update this
        page with JavaScript and React components.
      </p>
      <Bilibili bv="BV1ys411a7Wu" />
      <br className="mt-6" />
      <div className="filter dark:brightness-75">
        <Image
          src={`https://i.picsum.photos/id/1072/400/400.jpg?grayscale&hmac=CpiwecRoY6G5F_ZTZceMHxJkhHWv24p1ebO5iNvL24M`}
          width={"100%"}
          height={"100%"}
          layout="responsive"
          alt={"Random image"}
        />
      </div>
    </Blog>
  );
}
