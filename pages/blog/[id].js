import { useRouter } from "next/router";
import Blog from "../../components/blog";
import { getMdContent, getMdPostsData } from "../../lib/ssg";

export default function PathId(props) {
  const router = useRouter();
  const { id } = router.query;
  return (
    <Blog {...props}>
      <div
        className={id}
        dangerouslySetInnerHTML={{ __html: props.htmlStringContent }}
      ></div>
    </Blog>
  );
}

export const getStaticProps = async context => {
  const { id } = context.params;
  const mdData = await getMdContent(id);
  return {
    props: mdData,
  };
};

export const getStaticPaths = async () => {
  const mdPostsData = getMdPostsData();
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
