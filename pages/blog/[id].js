import Blog from "../../components/blog";
import {
  getMdContentById,
  getMdPostsData,
  defaultMarkdownDirectory,
} from "../../lib/ssg";
import path from "path";
import { lazy } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
const Douban = lazy(() => import("../../components/douban"));
const Bilibili = lazy(() => import("../../components/bilibili"));
const Tweet = lazy(() => import("../../components/twitter"));
const GitHub = lazy(() => import("../../components/github"));

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
  const mdData = await getMdContentById(
    `${id}.${context.locale}`,
    defaultMarkdownDirectory,
    false,
  );
  return {
    props: mdData,
  };
};

export const getStaticPaths = async () => {
  const mdPostsData = getMdPostsData(path.join(process.cwd(), "posts"));
  const paths = mdPostsData.map(data => {
    return {
      params: { id: data.id },
      locale: data.locale,
    };
  });
  // const paths = [
  //   { params: { id: "hi" } },
  // ];
  return {
    paths,
    fallback: true,
  };
};
