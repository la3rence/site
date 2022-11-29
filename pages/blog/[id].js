import Blog from "../../components/blog";
import { getMdContentById, getMdPostsData } from "../../lib/ssg";
import path from "path";
import Tag from "../../components/tag";

const PathId = props => {
  return (
    <Blog {...props}>
      <div dangerouslySetInnerHTML={{ __html: props.htmlStringContent }} />
      <div id="tag">
        {props.tag.split(",").map(tag => (
          <Tag tag={tag} key={tag} />
        ))}
      </div>
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
