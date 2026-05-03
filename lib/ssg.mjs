import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeSlug from "rehype-slug";
import rehypeToc from "@jsdevtools/rehype-toc";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { rehypeGithubAlerts } from "rehype-github-alerts";
import rehypeShiki from "@shikijs/rehype";
import { transformerMetaHighlight } from "@shikijs/transformers";
import rehypeVideo from "rehype-video";
import rehypeExternalLinks from "rehype-external-links";
import rehypeGist from "rehype-gist";
import rehypeFigure from "@microflash/rehype-figure";
import config from "./config.mjs";
import { getTranslations } from "./locales/index.mjs";
import cache from "./cache.js";
import { IS_PROD } from "./env.js";
import { rehypeEmbedPlaceholders, replaceEmbedTagsInHtml } from "./markdown-embeds.mjs";
import { rehypeImageLayout } from "./markdown-image-layout.mjs";

export const defaultMarkdownDirectory = path.join(process.cwd(), "posts");
export const defaultJSDirectory = path.join(process.cwd(), "pages/blog");
const GIST_MARKER = "`gist:";
const ALERT_PATTERNS = ["[!NOTE]", "[!TIP]", "[!IMPORTANT]", "[!WARNING]", "[!CAUTION]"];
const mdPostFileIndexCache = new Map();
const jsPostsDataCache = new Map();

const sortByDate = (a, b) => {
  if (a.date < b.date) {
    return 1;
  }
  return -1;
};

// set `visible: false` to make article hide from the web.
const filterVisibility = article => {
  return article.visible !== false;
};

const toVisibleSortedPosts = posts => posts.sort(sortByDate).filter(filterVisibility);

const uniqueBy = (items, getKey) => {
  const seen = new Set();
  return items.filter(item => {
    const key = getKey(item);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const resolveMarkdownDirectory = mdDirectory => mdDirectory ?? defaultMarkdownDirectory;

const readCachedValue = (key, message, ...args) => {
  if (!IS_PROD || !cache.has(key)) {
    return undefined;
  }

  console.log(message, ...args);
  return cache.get(key);
};

const writeCachedValue = (key, value) => {
  cache.set(key, value);
  return value;
};

const getPostFileInfo = (mdDirectory, mdPostName) => {
  const fileId = mdPostName.replace(/\.md$/, "");
  const idParts = fileId.split(".");
  const maybeLocale = idParts.at(-1);
  const hasLocaleSuffix = config.locales?.includes(maybeLocale);
  const locale = hasLocaleSuffix ? maybeLocale : config.defaultLocale;
  const idWithoutLocale = hasLocaleSuffix ? idParts.slice(0, -1).join(".") : fileId;

  return {
    fileName: fileId,
    fullPath: path.join(mdDirectory, mdPostName),
    id: idWithoutLocale,
    locale,
  };
};

const getMdPostFileIndex = mdDirectory => {
  const cachedIndex = mdPostFileIndexCache.get(mdDirectory);

  if (cachedIndex) {
    return cachedIndex;
  }

  const byContentId = new Map();
  const files = [];
  const languagesByPostId = new Map();
  const mdPostNames = fs.readdirSync(mdDirectory).filter(fileName => fileName.endsWith(".md"));

  mdPostNames.forEach(mdPostName => {
    const fileInfo = getPostFileInfo(mdDirectory, mdPostName);
    files.push(fileInfo);

    const languages = languagesByPostId.get(fileInfo.id) ?? new Set();
    languages.add(fileInfo.locale);
    languagesByPostId.set(fileInfo.id, languages);

    byContentId.set(fileInfo.fileName, fileInfo);

    if (fileInfo.locale === config.defaultLocale) {
      byContentId.set(`${fileInfo.id}.${config.defaultLocale}`, fileInfo);
    }
  });

  const index = {
    byContentId,
    files,
    languagesByPostId,
  };

  mdPostFileIndexCache.set(mdDirectory, index);
  return index;
};

const readMarkdownPostData = (fileInfo, { includeContent = false } = {}) => {
  const mdContent = fs.readFileSync(fileInfo.fullPath, "utf8");
  const matterResult = matter(mdContent);
  const postData = {
    id: fileInfo.id,
    fileName: fileInfo.fileName,
    locale: fileInfo.locale,
    ...matterResult.data,
  };

  if (includeContent) {
    postData.content = matterResult.content;
  }

  return postData;
};

const getMdPostsList = (mdDirectory, { includeContent = false } = {}) => {
  const postFileIndex = getMdPostFileIndex(mdDirectory);
  return toVisibleSortedPosts(
    postFileIndex.files.map(fileInfo => readMarkdownPostData(fileInfo, { includeContent })),
  );
};

export const getMdPostsData = mdDirectory => {
  mdDirectory = resolveMarkdownDirectory(mdDirectory);
  const cacheKey = `ssg:mdpostdata:${mdDirectory}`;
  const cachedData = readCachedValue(cacheKey, "cache hit: markdown posts data", mdDirectory);

  if (cachedData !== undefined) {
    return cachedData;
  }

  return writeCachedValue(cacheKey, getMdPostsList(mdDirectory, { includeContent: true }));
};

export const getMdPostsIndexData = mdDirectory => {
  mdDirectory = resolveMarkdownDirectory(mdDirectory);
  const cacheKey = `ssg:mdpostindex:${mdDirectory}`;
  const cachedData = readCachedValue(cacheKey, "cache hit: markdown post index", mdDirectory);

  if (cachedData !== undefined) {
    return cachedData;
  }

  return writeCachedValue(cacheKey, getMdPostsList(mdDirectory));
};

export const getMdContentById = async (id, mdDirectory, withHTMLString = true) => {
  // default using the `./posts` for markdown directory
  mdDirectory = resolveMarkdownDirectory(mdDirectory);
  const cacheKey = `ssg:mdcontent:${id}:${mdDirectory}:${withHTMLString}`;
  const cachedData = readCachedValue(
    cacheKey,
    "cache hit: markdown content for",
    id,
    "in",
    mdDirectory,
  );

  if (cachedData !== undefined) {
    return cachedData;
  }

  const isBlog = mdDirectory === defaultMarkdownDirectory; // if the markdown is blog article
  const postFileIndex = getMdPostFileIndex(mdDirectory);
  const fileInfo = postFileIndex.byContentId.get(id);

  if (!fileInfo) {
    return undefined;
  }

  const mdContent = fs.readFileSync(fileInfo.fullPath, "utf8");
  const fileStat = fs.statSync(fileInfo.fullPath);
  const matterResult = matter(mdContent);
  const languages = [...(postFileIndex.languagesByPostId.get(fileInfo.id) ?? [])].filter(language =>
    config.locales?.includes(language),
  );
  const hasGist = mdContent.includes(GIST_MARKER);
  const htmlResult = await renderHTMLfromMarkdownString(
    matterResult.content,
    isBlog,
    fileInfo.locale,
    {
      hasGist,
    },
  );
  const htmlStringContent = replaceEmbedTagsInHtml(htmlResult.value);
  const hasAlert = ALERT_PATTERNS.some(pattern => mdContent.includes(pattern));
  const postData = {
    id: fileInfo.id,
    birthTime: fileStat.birthtime.toISOString(),
    // modifiedTime: fileStat.mtime.toISOString(),
    author: config.authorName, // dafult authorName
    // content: matterResult.content, // original markdown string
    i18n: languages ? languages : null,
    locale: config.locales ? fileInfo.locale : null,
    htmlStringContent: withHTMLString ? htmlStringContent : "", // rendered html string
    hasGist,
    hasAlert,
    ...matterResult.data, // other details like date, title...
  };
  return writeCachedValue(cacheKey, postData);
};

const getJsPostsData = async jsDirectory => {
  const cachedPosts = jsPostsDataCache.get(jsDirectory);

  if (cachedPosts) {
    return cachedPosts;
  }

  const postsPromise = (async () => {
    const jsPostNames = fs.readdirSync(jsDirectory);
    // filter out the index and [id] from names
    const ids = jsPostNames
      .filter(name => name.endsWith(".js") || name.endsWith(".jsx"))
      .map(name => name.replace(/\.jsx?$/, ""))
      .filter(name => name !== "[id]" && name !== "index");
    return Promise.all(
      ids.map(async id => {
        // webpack only support this certain format like string. not variable
        const postModule = await import(`../pages/blog/${id}.js`);
        return {
          id,
          ...postModule.blogProps,
        };
      }),
    );
  })();

  jsPostsDataCache.set(jsDirectory, postsPromise);
  return postsPromise;
};

const getAllPosts = async ({ includeContent = false } = {}) => {
  const mdPostsData = includeContent ? getMdPostsData() : getMdPostsIndexData();
  const jsPostsData = await getJsPostsData(defaultJSDirectory);
  return toVisibleSortedPosts([...mdPostsData, ...jsPostsData]);
};

export const getAllPostData = async () => {
  return getAllPosts({ includeContent: true });
};

export const getAllPostIndexData = async () => {
  return getAllPosts();
};

export const getPostsByTag = async tag => {
  const allPosts = await getAllPostIndexData();
  return allPosts.filter(post => {
    return post.tags && post.tags.toLowerCase().includes(tag.toLowerCase());
  });
};

const splitTags = tags => {
  if (!tags) {
    return [];
  }

  return tags.split(",").map(tag => tag.trim().toLowerCase());
};

export const getAllTags = async () => {
  const allPosts = await getAllPostIndexData();
  const tags = allPosts.flatMap(post => splitTags(post.tags));
  return [...new Set(tags)];
};

export const getAllTagsLocale = async () => {
  const allPosts = await getAllPostIndexData();
  const tags = allPosts.flatMap(post =>
    splitTags(post.tags).map(tag => ({
      label: tag,
      locale: post.locale,
    })),
  );
  return uniqueBy(tags, tag => `${tag.label}:${tag.locale}`);
};

const blogTOC = (toc, isBlog, locale) => {
  const translations = getTranslations(locale);
  if (isBlog && config.enableToC && toc.children[0]?.children[0]) {
    return {
      type: "element",
      tagName: "details",
      children: [
        {
          type: "element",
          tagName: "summary",
          children: [{ type: "text", value: translations["Table of Contents"] }],
        },
        toc,
      ],
    };
  } else {
    return null;
  }
};

const renderHTMLfromMarkdownString = async (
  markdownString,
  isBlog,
  locale,
  { hasGist = false } = {},
) => {
  const processor = remark()
    .use(remarkGfm) // github flavored markdown
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeToc, { customizeTOC: toc => blogTOC(toc, isBlog, locale) })
    .use(rehypeAutolinkHeadings, { behavior: "wrap" })
    .use(rehypeExternalLinks, {
      target: "_blank",
      rel: "noopener",
    });

  if (hasGist) {
    processor.use(rehypeGist, {
      replaceParentParagraph: true,
      omitCodeBlocks: true,
      classNames: [`border-0`, `my-2`, `not-prose`],
    });
  }

  return processor
    .use(rehypeShiki, {
      themes: {
        light: "one-light",
        dark: "github-dark-default",
      },
      transformers: [transformerMetaHighlight({ matchAlgorithm: "v3" })],
    })
    .use(rehypeVideo, { details: false })
    .use(rehypeFigure)
    .use(rehypeImageLayout)
    .use(rehypeGithubAlerts)
    .use(rehypeEmbedPlaceholders)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdownString);
};
