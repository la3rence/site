import Blog from "../../components/blog";
import { getMdContentById, getMdPostsData } from "../../lib/ssg";
import path from "path";
import { createElement } from "react";
import rehypeReact from "rehype-react";
import dynamic from "next/dynamic";
import { Suspense } from "react";
// import Douban from "../../components/douban";
const Douban = dynamic(() => import("../../components/douban"), { ssr: false });

const renderAst = new rehypeReact({
  createElement,
  components: { douban: Douban },
}).Compiler;

const PathId = props => {
  console.log(props.htmlStringContent);
  return (
    <Suspense fallback={`Loading...`}>
      <Blog {...props}>
        {/* <div dangerouslySetInnerHTML={{ __html: props.htmlStringContent }} /> */}
        <main>{renderAst(props.htmlAst)}</main>
      </Blog>
    </Suspense>
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
