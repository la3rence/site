import Link from "next/link";
import withView from "../components/withView";
import Layout from "./../components/layout";
import { getAllPostData } from "../lib/ssg";

const Index = function index({ allPostsData }) {
  const hoverTabStyle =
    "hover:bg-gray-200 transition duration-200 dark:hover:bg-gray-700 dark:text-gray-300";
  return (
    <Layout blogIndex title={"Blog"}>
      <div className="blogIndex mt-8">
        {allPostsData.map(post => (
          <div className="my-4" key={post.id}>
            <span className="font-mono text-gray-500">{post.date}</span>
            <span className="p-2">
              <Link href={`/blog/${post.id}`}>
                <a className={`p-3 no-underline font-normal ${hoverTabStyle}`}>
                  <span>{post.title}</span>
                </a>
              </Link>
            </span>
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
