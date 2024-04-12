import { getPostsByTag, getAllTags, getAllTagsLocale } from "../../lib/ssg";
import Layout from "../../components/layout";
import Tag from "../../components/tag";
import { useRouter } from "next/router";
import Link from "next/link";

export default function TagPage(props) {
  const { query, locale } = useRouter();
  return (
    <Layout title={`Tag: ${query.tag}`} tags={`${query.tag}, Tags`}>
      <h2>
        Tagged with <code>{query.tag}</code>
      </h2>
      <div className="mt-8">
        {props.tags
          ?.filter(item => item.locale === locale)
          ?.map(item => (
            <Tag
              tag={item.label}
              key={`${item.label}_${item.locale}`}
              highlight={query.tag.toLowerCase().trim() === item.label}
              locale={item.locale}
            />
          ))}
      </div>
      <div className="mt-8 mx-4">
        {props.data
          ?.filter(post => post.locale === locale)
          .map(post => (
            <div className="mt-6" key={post.id}>
              <span className="text-lg">
                <Link
                  href={`/blog/${post.id}`}
                  className={`p-0 no-underline font-normal`}
                  locale={locale}
                >
                  {post.title}
                </Link>
              </span>
              <div className="font-mono pt-2">
                <span className="pr-2">{post.date}</span>
                {post.tags.split(",").map(tag => (
                  <Tag tag={tag} key={tag} locale={locale} />
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
  const tags = await getAllTagsLocale();
  return {
    props: {
      data: postData,
      tags: tags,
    },
  };
};

export const getStaticPaths = async context => {
  const tags = await getAllTags();
  const paths = [];
  context.locales.forEach(locale => {
    const pathsWithLocale = tags.map(tag => {
      return {
        params: {
          tag: tag,
        },
        locale: locale,
      };
    });
    paths.push(...pathsWithLocale);
  });
  return {
    paths,
    fallback: false,
  };
};
