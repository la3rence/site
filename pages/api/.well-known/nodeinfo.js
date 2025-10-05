import { getOrigin } from "../../../lib/util";
import config from "../../../lib/config.mjs";

export default async function nodeinfo(req, res) {
  if (!config.enableActivityPub) {
    res.sendStatus(404);
    return;
  }
  try {
    const origin = getOrigin(req);
    res.json({
      links: [
        {
          rel: "http://nodeinfo.diaspora.software/ns/schema/2.0",
          href: `${origin}/api/activitypub/nodeinfo`,
        },
      ],
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}
