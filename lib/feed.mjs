import {
  getMdContentById,
  getMdPostsData,
  defaultMarkdownDirectory,
} from "./ssg.mjs";
import config from "./config.mjs";

const {
  siteTitle,
  authorName,
  authorEmail,
  baseURL,
  websubHub,
  feedItemsCount,
} = config;

// https://datatracker.ietf.org/doc/html/rfc4287
const buildFeed = async () => {
  const markdownData = getMdPostsData();
  const postContents = await Promise.all(
    markdownData.map(async item => {
      return await getMdContentById(item.id, defaultMarkdownDirectory);
    }),
  );
  // only output the recent blog posts
  const feed = createRSS(
    postContents.slice(0, Math.min(feedItemsCount, postContents.length)),
  );
  console.log(feed);
};

function mapToAtomEntry(post) {
  const categories = post.tags?.split(",");
  return `
    <entry>
      <title>${decode(post.title)}</title>
      <id>${baseURL}/blog/${post.id}</id>
      <link href="${baseURL}/blog/${post.id}"/>
      <published>${post.date}T00:00:00.000Z</published>
      <updated>${
        post.modified ? post.modified : post.date
      }T00:00:00.000Z</updated>
      ${categories
        .map(tag => {
          return `<category term="${tag
            .trim()
            .toLowerCase()}" label="${tag.trim()}" scheme="${baseURL}/tag/${tag
            .trim()
            .toLowerCase()}"/>`;
        })
        .join("")}
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
    <link href="${websubHub}" rel="hub" />
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
