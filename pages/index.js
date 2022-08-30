import Link from "next/link";
import withView from "../components/withView";
import Layout from "./../components/layout";
import { getAllPostData } from "./../lib/ssg.js";

const Index = function index({ allPostsData }) {
  return (
    <Layout blogIndex title={"Blog"}>
      <div className="blogIndex mt-12">
        {allPostsData.map(post => (
          <div className="my-3" key={post.id}>
            <Link href={`/blog/${post.id}`}>
              <a className="no-underline hover:underline">{post.title}</a>
            </Link>
            <span className="before:content-['/'] before:px-3">{post.date}</span>
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default withView(Index);

export const getStaticProps = async () => {
  const allPostsData = await getAllPostData();
  return {
    props: {
      allPostsData,
    },
  };
};
