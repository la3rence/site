import Link from "next/link";
import Layout from "./../components/layout";
import { getAllPostData } from "./../lib/ssg.js";

export default function index({ allPostsData }) {
  return (
    <Layout blogIndex title={"Blog"} id="/">
      <div className="blogIndex mt-12">
        {allPostsData.map(post => (
          <div className="my-3" key={post.id}>
            <Link href={`/blog/${post.id}`}>
              <a className="no-underline hover:underline">{post.title}</a>
            </Link>
            <span className="mx-3">/</span>
            <span className="">{post.date}</span>
          </div>
        ))}
      </div>
    </Layout>
  );
}

export const getStaticProps = async () => {
  const allPostsData = await getAllPostData();
  return {
    props: {
      allPostsData,
    },
  };
};
