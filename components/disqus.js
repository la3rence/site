import { DiscussionEmbed } from "disqus-react";
import cfg from "../lib/config.mjs";

const Disqus = ({ url, identifier, title }) => {
  return (
    <div className="mt-4 mx-2">
      <DiscussionEmbed
        shortname={cfg.disqusName}
        config={{
          url,
          identifier,
          title,
        }}
      />
    </div>
  );
};
export default Disqus;
