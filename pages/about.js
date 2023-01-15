import Layout from "../components/layout";
import { getMdContentById } from "../lib/ssg";
import withView from "../components/withView";
import Project from "../components/project";
import config from "../lib/config.mjs";

const About = props => {
  return (
    <Layout title={"About"}>
      <div
        dangerouslySetInnerHTML={{
          __html: props.htmlStringContent,
        }}
      />
      {config.projects && (
        <>
          <h2 id="projects">
            <a href="#projects">Projects</a>
          </h2>
          <div className="flex flex-wrap gap-3">
            {config.projects.map(project => (
              <Project {...project} key={project.name} />
            ))}
          </div>
        </>
      )}
      {config.mailchimp && (
        <>
          <h2 id="mailchimp">
            <a href="#mailchimp">Mail Subscription</a>
          </h2>
          <p>
            Subscribe this blog via{" "}
            <a
              href={config.mailchimp}
              target="_blank"
              className=" text-yellow-500"
            >
              MailChimp
            </a>
            . You will receive the mail about my new post when it published.
          </p>
        </>
      )}
      <>
        <h2 id="ActivityPub">
          <a href="#activitypub">ActivityPub</a>
        </h2>
        <p>
          This blog is now in the <strong>Fediverse</strong>. Follow it with
          ActivityPub:{" "}
          <code>
            @{config.activityPubUser}@{props.domain}
          </code>
        </p>
      </>
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
