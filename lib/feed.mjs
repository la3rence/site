import {
  getMdContentById,
  getMdPostsData,
  defaultMarkdownDirectory,
} from "./ssg.mjs";
import config from "./config.mjs";
import fs from "node:fs";

const {
  authorName,
  authorEmail,
  baseURL,
  defaultLocale,
  feedFile,
  feedItemsCount,
  siteTitle,
  siteDescription,
  websubHub,
  locales,
} = config;

// https://datatracker.ietf.org/doc/html/rfc4287
const buildFeed = async () => {
  const markdownData = getMdPostsData();
  const postContents = await Promise.all(
    markdownData.map(async item => {
      return await getMdContentById(item.fileName, defaultMarkdownDirectory);
    }),
  );
  locales?.forEach(locale => {
    console.log("Building feed for", locale);
    const feed = createRSS(postContents, locale);
    const fileName = `./public/atom.${locale}.xml`;
    fs.openSync(fileName, "w");
    fs.writeFileSync(fileName, feed);
    if (locale === defaultLocale) {
      // just an alternate for default locale feed (to keep old link working)
      fs.writeFileSync(`./public/${feedFile}`, feed);
    }
  });
};

function mapToAtomEntry(post) {
  const categories = post.tags?.split(",");
  let postLink = `${baseURL}/${post.locale}/blog/${post.id}`;
  if (post.locale === defaultLocale) {
    postLink = `${baseURL}/blog/${post.id}`;
  }
  return `<entry>
      <title>${decode(post.title)}</title>
      <id>${postLink}</id>
      <link href="${postLink}"/>
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

function createRSS(blogPosts, locale) {
  const postsString = blogPosts
    .filter(post => post.locale === locale)
    .map(mapToAtomEntry)
    .slice(0, Math.min(feedItemsCount, blogPosts.length))
    .reduce((a, b) => a + b, "");
  let feedURL = `${baseURL}/${locale}/${feedFile}`;
  if (locale === defaultLocale) {
    feedURL = `${baseURL}/${feedFile}`;
  }
  return `<?xml version="1.0" encoding="utf-8"?>
  <feed xmlns="http://www.w3.org/2005/Atom">
    <title>${siteTitle}</title>
    <subtitle>${siteDescription}</subtitle>
    <link href="${feedURL}" rel="self" type="application/atom+xml" />
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
