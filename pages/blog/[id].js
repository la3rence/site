import Blog from "../../components/blog";
import {
  getMdContentById,
  getMdPostsData,
  defaultMarkdownDirectory,
} from "../../lib/ssg";
import path from "path";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import Douban from "../../components/douban";
import Bilibili from "../../components/bilibili";
import GitHub from "../../components/github";
import Tweet from "../../components/twitter";

const render = ast => {
  return toJsxRuntime(ast, {
    Fragment,
    jsx,
    jsxs,
    components: {
      douban: Douban,
      bilibili: Bilibili,
      github: GitHub,
      tweet: Tweet,
    },
  });
};

const PathId = props => {
  return (
    <Blog {...props}>
      {/* <div dangerouslySetInnerHTML={{ __html: props.htmlStringContent }} /> */}
      <main>{render(props.htmlAst)}</main>
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
