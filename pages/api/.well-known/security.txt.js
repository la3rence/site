import config from "../../../lib/config.mjs";

export default async function nodeinfo(req, res) {
  const { github, baseURL } = config;
  res.end(
    `Contact: https://hackerone.com/${github}
Preferred-Languages: zh,en
Canonical: ${baseURL}/.well-known/security.txt
Expires: 2070-01-01T00:00:00z
`,
  );
}
