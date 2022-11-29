import { getPostsByTag, getAllTags } from "../../lib/ssg";
import Layout from "../../components/layout";
import Tag from "../../components/tag";
import { useRouter } from "next/router";
import Link from "next/link";

export default function TagPage(props) {
  const { query } = useRouter();
  return (
    <Layout>
      <h2>Tag: {query.tag}</h2>
      <div className="mt-8 px-1">
        {props.data.map(post => (
          <div className="my-4" key={post.id}>
            <span className="text-lg">
              <Link
                href={`/blog/${post.id}`}
                className={`p-3 no-underline font-normal `}
              >
                <span>{post.title}</span>
              </Link>
            </span>
            <div className="font-mono p-3">
              <span className="pr-2">{post.date}</span>
              {post.tag.split(",").map(tag => (
                <Tag tag={tag} key={tag} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}

export const getStaticProps = async context => {
  const { tag } = context.params;
  const postData = await getPostsByTag(tag);
  return {
    props: {
      data: postData,
    },
  };
};

export const getStaticPaths = async () => {
  const tags = await getAllTags();
  const paths = tags.map(tag => {
    return {
      params: {
        tag: tag,
      },
    };
  });
  return {
    paths,
    fallback: false,
  };
};
