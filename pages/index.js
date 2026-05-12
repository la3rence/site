import Layout from "./../components/layout";
import PostIndexItem from "../components/post-index-item";
import { getAllPostIndexData } from "../lib/ssg";

const getYear = date => new Date(date).getFullYear();

const Index = function index({ postsByYear }) {
  return (
    <Layout blogIndex title={"Blog"} tags={"Blog"}>
      <div className="blogIndex mt-8">
        {postsByYear.map(({ year, posts }) => (
          <div key={year}>
            <div className="text-zinc-500 text-2xl mt-12 mb-6" id={year}>
              {year}
            </div>
            {posts.map(post => (
              <PostIndexItem post={post} key={`${post.id}:${post.locale}`} />
            ))}
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default Index;

export const getStaticProps = async ({ locale }) => {
  const postsByYearMap = (await getAllPostIndexData())
    .filter(post => post.locale === locale)
    .reduce((result, post) => {
      const year = getYear(post.date);
      const posts = result[year] || [];

      posts.push({
        id: post.id,
        title: post.title,
        date: post.date,
        locale: post.locale ? post.locale : null,
      });

      result[year] = posts;
      return result;
    }, {});

  const postsByYear = Object.keys(postsByYearMap)
    .sort((a, b) => b - a)
    .map(year => ({
      year,
      posts: postsByYearMap[year],
    }));

  return {
    props: {
      postsByYear,
    },
  };
};
