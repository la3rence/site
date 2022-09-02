import Blog from "../../components/blog";
import Image from "next/image";
import config from "./../../lib/config.json";
import "react-static-tweets/styles.css";
import { fetchTweetAst } from "static-tweets";
import { Tweet } from "react-static-tweets";

export const author = config.authorName;
export const title = "SSG Example";
export const date = "2022-08-26";

const tweetId = "1358199505280262150";

export default function Example(props) {
  const { tweetId, tweetAst } = props;
  return (
    <Blog title={title} date={date} author={author}>
      <p>
        This page is fully rendered by <code>JSX</code>. You can update this
        page with JavaScript and React components.
      </p>

      <Tweet id={tweetId} ast={tweetAst} />
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

export const getStaticProps = async () => {
  try {
    const tweetAst = await fetchTweetAst(tweetId);
    return {
      props: {
        tweetId,
        tweetAst,
      },
      revalidate: 10,
    };
  } catch (err) {
    console.error("error fetching tweet info", err);
    throw err;
  }
};
