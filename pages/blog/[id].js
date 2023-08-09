import Blog from "../../components/blog";
import {
  getMdContentById,
  getMdPostsData,
  defaultMarkdownDirectory,
} from "../../lib/ssg";
import path from "path";
import { createElement } from "react";
import rehypeReact from "rehype-react";
import Douban from "../../components/douban";
import Bilibili from "../../components/bilibili";
import GitHub from "../../components/github";
import Tweet from "../../components/twitter";

const renderAst = new rehypeReact({
  createElement,
  components: {
    douban: Douban,
    bilibili: Bilibili,
    github: GitHub,
    tweet: Tweet,
  },
}).Compiler;

const PathId = props => {
  return (
    <Blog {...props}>
      {/* <div dangerouslySetInnerHTML={{ __html: props.htmlStringContent }} /> */}
      <main>{renderAst(props.htmlAst)}</main>
    </Blog>
  );
};

export default PathId;

export const getStaticProps = async context => {
  const { id } = context.params;
  const mdData = await getMdContentById(id, defaultMarkdownDirectory, false);
  return {
    props: mdData,
  };
};

export const getStaticPaths = async () => {
  const mdPostsData = getMdPostsData(path.join(process.cwd(), "posts"));
  const paths = mdPostsData.map(data => {
    return {
      params: data,
    };
  });
  // const paths = [
  //   { params: { id: "hi" } },
  // ];
  return {
    paths,
    fallback: false,
  };
};
