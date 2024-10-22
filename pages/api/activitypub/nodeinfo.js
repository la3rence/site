import config from "../../../lib/config.mjs";

export default async function nodeInfo(req, res) {
  try {
    const { siteDescription, baseURL, github, repo } = config;
    const data = {
      metadata: {
        nodeName: "site - lawrenceli.me",
        nodeDescription: siteDescription,
        software: {
          homepage: baseURL,
          github: `https://github.com/${github}/${repo}`,
          follow: "https://mstdn.social/@lawrence",
        },
      },
      openRegistrations: false,
      protocols: ["activitypub"],
      services: { inbound: [], outbound: [] },
      software: { name: repo, version: "1.0.0" },
      usage: { users: { total: 1, activeHalfyear: 1, activeMonth: 1 }, localPosts: 20 },
      version: "2.0",
    };
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error });
  }
}
