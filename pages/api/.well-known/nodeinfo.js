import { getOrigin } from "../../../lib/util";

export default async function nodeinfo(req, res) {
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
