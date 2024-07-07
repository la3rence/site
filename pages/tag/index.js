import { getAllTagsLocale } from "../../lib/ssg";
import Layout from "../../components/layout";
import Tag from "../../components/tag";
import { useRouter } from "next/router";
import withLocalization from "../../components/withI18n";

function TagIndex({ tags, translations }) {
  const { locale } = useRouter();
  return (
    <Layout title={translations["Tags"]} tags={`Tags`}>
      <div className="tags">
        <h2>{translations["Tags"]}</h2>
        <div className="mt-8">
          {tags
            ?.filter(item => item.locale === locale)
            ?.map(item => (
              <Tag tag={item.label} key={item.label} locale={item.locale} />
            ))}
        </div>
      </div>
    </Layout>
  );
}

export default withLocalization(TagIndex);

export const getStaticProps = async () => {
  const tags = await getAllTagsLocale();
  return {
    props: {
      tags,
    },
  };
};
