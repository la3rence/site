import Blog from "../../components/blog";
import Image from "next/image";
import config from "./../../lib/config.json";
export const author = config.authorName;
export const title = "SSG Example";
export const date = "2022-08-26";

export default function Example() {
  return (
    <Blog title={title} date={date} author={author}>
      <p>
        This page is fully rendered by <code>JSX</code>. You can update this
        page with JavaScript and React components.
      </p>
      <div className="-mx-6 filter dark:brightness-50">
        <Image
          src={`https://i.picsum.photos/id/1072/400/400.jpg?grayscale&hmac=CpiwecRoY6G5F_ZTZceMHxJkhHWv24p1ebO5iNvL24M`}
          width={"100%"}
          height={"100%"}
          layout="responsive"
          alt={"Random image"}
        ></Image>
      </div>
    </Blog>
  );
}
