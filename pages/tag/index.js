import { getAllTags } from "../../lib/ssg";
import Layout from "../../components/layout";
import Tag from "../../components/tag";
import { useRouter } from "next/router";

export default function TagIndex(props) {
  const { locale } = useRouter();
  return (
    <Layout title={`Tags`} tags={`Tags`}>
      <h2>Tags</h2>
      <div className="mt-8">
        {props.tags.map(tag => (
          <Tag tag={tag} key={tag} locale={locale} />
        ))}
      </div>
    </Layout>
  );
}

export const getStaticProps = async () => {
  const tags = await getAllTags();
  return {
    props: {
      tags: tags,
    },
  };
};
