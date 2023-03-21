import Link from "next/link";
import withView from "../components/withView";
import Layout from "./../components/layout";
import { getAllPostData } from "../lib/ssg";

const getYear = date => new Date(date).getFullYear();

const Index = function index({ allPostsData }) {
  const aggregatedPosts = allPostsData.reduce((result, currentPost) => {
    (result[getYear(currentPost.date)] =
      result[getYear(currentPost.date)] || []).push(currentPost);
    return result;
  }, {});
  return (
    <Layout blogIndex title={"Blog"}>
      <div className="blogIndex mt-8">
        {Object.keys(aggregatedPosts)
          .sort((a, b) => b - a)
          .map(year => {
            return (
              <div key={year}>
                <div
                  className="text-zinc-400 dark:text-zinc-600 text-2xl mt-12 mb-6"
                  id={year}
                >
                  {year}
                </div>
                {aggregatedPosts[year].map(post => (
                  <div className="my-4" key={post.id}>
                    <Link
                      href={`/blog/${post.id}`}
                      className={`text-lg font-normal no-underline hover:text-zinc-500`}
                    >
                      <span>{post.title}</span>
                      <span className="font-mono text-base text-zinc-500 float-right">
                        {post.date}
                      </span>
                    </Link>
                  </div>
                ))}
              </div>
            );
          })}
      </div>
    </Layout>
  );
};

export default withView(Index);

export const getStaticProps = async () => {
  const allPostsData = await getAllPostData();
  allPostsData.forEach(post => {
    delete post.content;
    delete post.tags;
    delete post.description;
  });
  return {
    props: {
      allPostsData,
    },
  };
};
