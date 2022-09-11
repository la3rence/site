import Layout from "../components/layout";
import { getMdContentById } from "../lib/ssg";
import withView from "../components/withView";

const About = props => {
  return (
    <Layout title={"About"}>
      <div dangerouslySetInnerHTML={{ __html: props.htmlStringContent }} />
    </Layout>
  );
};

export default withView(About);

// render `./readme.md`
export const getStaticProps = async () => {
  const mdData = await getMdContentById("readme", process.cwd());
  return {
    props: mdData,
  };
};
