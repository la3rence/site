import Link from "next/link";
import withView from "../components/withView";
import Layout from "./../components/layout";
import { useRouter } from "next/router";
import { getAllPostData } from "../lib/ssg";

const getYear = date => new Date(date).getFullYear();

const Index = function index({ allPostsData }) {
  const aggregatedPosts = allPostsData.reduce((result, currentPost) => {
    (result[getYear(currentPost.date)] =
      result[getYear(currentPost.date)] || []).push(currentPost);
    return result;
  }, {});
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const router = useRouter();
  return (
    <Layout blogIndex title={"Blog"} tags={"Blog"}>
      <div className="blogIndex mt-8">
        {Object.keys(aggregatedPosts)
          .sort((a, b) => b - a)
          .map(year => {
            return (
              <div key={year}>
                {aggregatedPosts[year].some(
                  post => post.locale === router.locale,
                ) && (
                  <div className="text-zinc-500 text-2xl mt-12 mb-6" id={year}>
                    {year}
                  </div>
                )}
                {aggregatedPosts[year]
                  .filter(post => post.locale === router.locale)
                  .map(post => (
                    <div className="my-4" key={post.id}>
                      <Link
                        href={`/blog/${post.id}`}
                        locale={post.locale}
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
  const allPostsData = (await getAllPostData()).map(post => ({
    id: post.id,
    title: post.title,
    date: post.date,
    locale: post.locale,
  }));
  return {
    props: {
      allPostsData,
    },
  };
};
