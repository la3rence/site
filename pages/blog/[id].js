import Blog from "../../components/blog";
import { getMdContentById, getMdPostsData } from "../../lib/ssg";
import path from "path";
import { createElement } from "react";
import rehypeReact from "rehype-react";
import Douban from "../../components/douban";
import Bilibili from "../../components/bilibili";

const renderAst = new rehypeReact({
  createElement,
  components: { douban: Douban, bilibili: Bilibili },
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
  const mdData = await getMdContentById(id);
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
