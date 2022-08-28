import Layout from "../components/layout";
import { getMdContentById } from "../lib/ssg";

export default function About(props) {
  return (
    <Layout title={"About"}>
      <div dangerouslySetInnerHTML={{ __html: props.htmlStringContent }}></div>
    </Layout>
  );
}

// render `./readme.md`
export const getStaticProps = async () => {
  const mdData = await getMdContentById("readme", process.cwd());
  return {
    props: mdData,
  };
};
