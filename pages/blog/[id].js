import { memo, useRef } from "react";
import path from "path";
import Blog from "../../components/blog";
import EmbedHydrator from "../../components/embed-hydrator";
import { getMdContentById, getMdPostsData, defaultMarkdownDirectory } from "../../lib/ssg";
import config from "../../lib/config.mjs";

const PathId = props => {
  const containerRef = useRef(null);

  return (
    <Blog {...props}>
      <main className="overflow-visible h-auto">
        <div ref={containerRef} dangerouslySetInnerHTML={{ __html: props.htmlStringContent }} />
        <EmbedHydrator containerRef={containerRef} />
      </main>
    </Blog>
  );
};

export default memo(PathId);

export const getStaticProps = async context => {
  const { id } = context.params;
  const locale = context.locale;
  const mdData = await getMdContentById(
    locale ? `${id}.${locale}` : id,
    defaultMarkdownDirectory,
    true,
  );
  return {
    props: mdData,
  };
};

export const getStaticPaths = async () => {
  const mdPostsData = getMdPostsData(path.join(process.cwd(), "posts"));
  const paths = mdPostsData.map(data => {
    return {
      params: { id: data.id },
      locale: config.locales?.includes(data.locale) ? data.locale : config.defaultLocale,
    };
  });
  return {
    paths,
    fallback: false,
  };
};
