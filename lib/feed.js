import { getMdContentById, getMdPostsData } from "./ssg.js";
import { config } from "./ssg.js";
const { siteTitle, authorName, authorEmail, baseURL } = config;

const buildFeed = async () => {
  const markdownData = getMdPostsData();
  const postContents = await Promise.all(
    markdownData.map(async item => {
      return await getMdContentById(item.id);
    })
  );
  const feed = createRSS(postContents);
  console.log(feed);
};

function mapToAtomEntry(post) {
  return `
    <entry>
      <title>${decode(post.title)}</title>
      <id>${baseURL}/blog/${post.id}</id>
      <link href="${baseURL}/blog/${post.id}"/>
      <updated>${post.date}T08:00:00Z</updated>
      <summary type="html">${decode(post.htmlStringContent)}</summary>
      <author><name>${post.author}</name></author>
    </entry>`;
}

function decode(string) {
  return string
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function createRSS(blogPosts = []) {
  const postsString = blogPosts.map(mapToAtomEntry).reduce((a, b) => a + b, "");
  return `<?xml version="1.0" encoding="utf-8"?>
  <feed xmlns="http://www.w3.org/2005/Atom">
    <title>${siteTitle}</title>
    <subtitle>Blog</subtitle>
    <link href="${baseURL}/atom.xml" rel="self" type="application/atom+xml" />
    <link href="${baseURL}/"/>
    <id>${baseURL}/</id>
    <updated>${new Date().toJSON()}</updated>
    <author>
        <name>${authorName}</name>
        <email>${authorEmail}</email>
    </author>
   ${postsString}
  </feed>`;
}

const build = async () => {
  await buildFeed();
};

build().catch(error => console.error(error));

// todo:
// buildReactPage();
// may need react dom server for rendering the React comp -> HTML
