import Layout from "../components/layout";
import { getMdContentById } from "../lib/ssg";
import withView from "../components/withView";
import Project from "../components/project";
import config from "../lib/config.mjs";
import withLocalization from "../components/withI18n";
import { useRouter } from "next/router";

const About = props => {
  const translations = props.translations;
  const locale = useRouter().locale;
  return (
    <Layout title={translations["About"]} tags={"About"}>
      <div
        dangerouslySetInnerHTML={{
          __html: props.htmlStringContent,
        }}
      />
      {config.projects && (
        <>
          <h3 id="projects">
            <a href="#projects">{translations["Open-Source Projects"]}</a>
          </h3>
          <div className="flex flex-wrap gap-3">
            {config.projects.map(project => (
              <Project {...project} key={project.name} locale={locale} />
            ))}
          </div>
        </>
      )}
    </Layout>
  );
};

export default withView(withLocalization(About));

// render `./readme.md` or `./reademe.en.md`
export const getStaticProps = async context => {
  const locale = context.locale;
  const mdData = await getMdContentById(`readme.${locale}`, process.cwd());
  mdData.locale = locale;
  return {
    props: mdData,
  };
};
