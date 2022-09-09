import Layout from "../components/layout";
import FanfouSDK from "fanfou-sdk";
import Fanfou from "../components/fanfou";
import withView from "../components/withView";

const Moment = props => {
  const { timeline } = props;
  const posts = JSON.parse(timeline);
  return (
    <Layout title={"Moment"}>
      <h2>Moment</h2>
      {posts.map(item => {
        return <Fanfou {...item} key={item.id} />;
      })}
    </Layout>
  );
};

export default withView(Moment);

// get fanfou posts
export const getStaticProps = async () => {
  const ff = await fanfouClient();
  const timeline = await ff.get("/statuses/user_timeline", {
    id: "jaylee.me",
    count: 12, // weird, it always got 12 items
    page: 1,
  });
  return {
    props: {
      timeline: JSON.stringify(timeline),
    },
    // Incremental Static Regeneration
    revalidate: 2 * 3600,
  };
};

const fanfouClient = async () => {
  const ff = new FanfouSDK({
    consumerKey: process.env.FF_CONSUMERKEY,
    consumerSecret: process.env.FF_CONSUMERSECRET,
    username: process.env.CF_EMAIL,
    password: process.env.FF_PASSWORD,
  });
  await ff.xauth();
  return ff;
};
