import { getPostsByTag, getAllTags } from "../../lib/ssg";
import Layout from "../../components/layout";
import Tag from "../../components/tag";
import { useRouter } from "next/router";
import Link from "next/link";

export default function TagPage(props) {
  const { query } = useRouter();
  return (
    <Layout title={`Tag: ${query.tag}`} tags={`${query.tag}, Tags`}>
      <h2>
        Tagged with <code>{query.tag}</code>
      </h2>
      <div className="mt-8">
        {props.tags.map(tag => (
          <Tag
            tag={tag}
            key={tag}
            highlight={query.tag.toLowerCase().trim() === tag}
          />
        ))}
      </div>
      <div className="mt-8 mx-4">
        {props.data.map(post => (
          <div className="mt-6" key={post.id}>
            <span className="text-lg">
              <Link
                href={`/blog/${post.id}`}
                className={`p-0 no-underline font-normal`}
                locale={post.locale}
              >
                {post.title}
              </Link>
            </span>
            <div className="font-mono pt-2">
              <span className="pr-2">{post.date}</span>
              {post.tags.split(",").map(tag => (
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
  const tags = await getAllTags();
  return {
    props: {
      data: postData,
      tags: tags,
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
