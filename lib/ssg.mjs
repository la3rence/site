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
import rehypeShiki from "@shikijs/rehype";
import { transformerMetaHighlight } from "@shikijs/transformers";
import rehypeVideo from "rehype-video";
import rehypeExternalLinks from "rehype-external-links";
import rehypeGist from "rehype-gist";
import rehypeFigure from "@microflash/rehype-figure";
import { fromHtml } from "hast-util-from-html";
import config from "./config.mjs";
import { getTranslations } from "./locales/index.mjs";
import cache from "./cache.js";
import { IS_PROD } from "./env.js";

export const defaultMarkdownDirectory = path.join(process.cwd(), "posts");
export const defaultJSDirectory = path.join(process.cwd(), "pages/blog");

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

export const getMdPostsData = mdDirectory => {
  if (!mdDirectory) {
    mdDirectory = defaultMarkdownDirectory;
  }
  // in-mem cache
  if (cache.has("ssg:mdpostdata:" + mdDirectory) && IS_PROD) {
    console.log("cache hit: markdown posts data", mdDirectory);
    return cache.get("ssg:mdpostdata:" + mdDirectory);
  }
  const mdPostNames = fs.readdirSync(mdDirectory);
  const mdPostsData = mdPostNames
    .filter(fileName => fileName.includes(".md"))
    .map(mdPostName => {
      const id = mdPostName.replace(/\.md$/, "");
      const locale = id.includes(".") ? id.split(".")[1] : config.defaultLocale;
      const idWithoutLocale = id.replace(`.${locale}`, "");
      const fullPath = path.join(mdDirectory, mdPostName);
      const mdContent = fs.readFileSync(fullPath, "utf8");
      const matterResult = matter(mdContent);
      return {
        id: idWithoutLocale,
        fileName: id,
        locale,
        ...matterResult.data,
        content: matterResult.content,
      };
    });
  const filteredData = mdPostsData.sort(sortByDate).filter(filterVisibility);
  cache.set("ssg:mdpostdata:" + mdDirectory, filteredData);
  return filteredData;
};

const getI18nLanguagesByTitle = (i18nTitle, mdPostNames) => {
  const languages = new Set();
  mdPostNames.forEach(fileName => {
    if (fileName.startsWith(i18nTitle)) {
      if (fileName.split(".")[1] === "md") {
        languages.add(config.defaultLocale ? config.defaultLocale : null);
      } else {
        languages.add(fileName.split(".")[1]);
      }
    }
  });
  return [...languages];
};

export const getMdContentById = (id, mdDirectory, withHTMLString = true) => {
  // default using the `./posts` for markdown directory
  if (!mdDirectory) {
    mdDirectory = defaultMarkdownDirectory;
  }
  // in-mem cache
  if (cache.has(`ssg:mdcontent:${id}:${mdDirectory}:${withHTMLString}`) && IS_PROD) {
    console.log("cache hit: markdown content for", id, "in", mdDirectory);
    return cache.get(`ssg:mdcontent:${id}:${mdDirectory}:${withHTMLString}`);
  }
  const isBlog = mdDirectory === defaultMarkdownDirectory; // if the markdown is blog article
  const mdPostNames = fs.readdirSync(mdDirectory);
  const mdPostsData = mdPostNames
    .filter(fileName => {
      if (fileName.includes(`.${config.defaultLocale}`)) {
        return fileName === id + ".md";
      }
      return fileName === id.replace(`.${config.defaultLocale}`, "") + ".md";
    })
    .map(async mdPostName => {
      const fullPath = path.join(mdDirectory, mdPostName);
      const mdContent = fs.readFileSync(fullPath, "utf8");
      const fileStat = fs.statSync(fullPath);
      const matterResult = matter(mdContent);
      const locale = id.includes(".") ? id.split(".")[1] : config.defaultLocale;
      const idWithoutLocale = id.replace(`.${locale}`, "");
      const languages = getI18nLanguagesByTitle(mdPostName.split(".")[0], mdPostNames).filter(
        language => config.locales?.includes(language),
      );
      const htmlResult = await renderHTMLfromMarkdownString(matterResult.content, isBlog, locale);
      let hasGist = false;
      if (mdContent.includes("`gist:")) {
        // if contains gist, add css link @see: components/blog.js
        hasGist = true;
      }
      return {
        id: idWithoutLocale,
        birthTime: fileStat.birthtime.toISOString(),
        // modifiedTime: fileStat.mtime.toISOString(),
        author: config.authorName, // dafult authorName
        // content: matterResult.content, // original markdown string
        i18n: languages ? languages : null,
        locale: config.locales ? locale : null,
        htmlStringContent: withHTMLString ? htmlResult.value : "", // rendered html string
        htmlAst: isBlog
          ? fromHtml(htmlResult.value, {
              fragment: true,
            })
          : {}, // only output ast if it's a blog post
        hasGist,
        ...matterResult.data, // other details like date, title...
      };
    });
  const postData = mdPostsData[0];
  cache.set(`ssg:mdcontent:${id}:${mdDirectory}:${withHTMLString}`, postData);
  return postData;
};

const getJsPostsData = async jsDirectory => {
  const jsPostNames = fs.readdirSync(jsDirectory);
  // filter out the index and [id] from names
  const ids = jsPostNames
    .filter(name => name.endsWith(".js") || name.endsWith(".jsx"))
    .map(name => name.replace(/\.js$/, ""))
    .filter(name => name !== "[id]" && name !== "index");
  const jsPostData = await Promise.all(
    ids.map(async id => {
      // webpack only support this certain format like string. not variable
      const postModule = await import(`../pages/blog/${id}.js`);
      return {
        id,
        ...postModule.blogProps,
      };
    }),
  );
  return jsPostData;
};

export const getAllPostData = async () => {
  const mdPostsData = getMdPostsData();
  const jsPostsData = await getJsPostsData(defaultJSDirectory);
  const all = [...mdPostsData, ...jsPostsData];
  return all.sort(sortByDate).filter(filterVisibility);
};

export const getPostsByTag = async tag => {
  const allPosts = await getAllPostData();
  return allPosts.filter(post => {
    return post.tags && post.tags.toLowerCase().includes(tag.toLowerCase());
  });
};

export const getAllTags = async () => {
  const allPosts = await getAllPostData();
  let tags = [];
  allPosts.map(post => {
    if (post.tags) {
      const tagArray = post.tags.split(",");
      tagArray.map(each => tags.push(each.trim().toLowerCase()));
    }
  });
  return [...new Set(tags)];
};

export const getAllTagsLocale = async () => {
  const tags = [];
  const allPosts = await getAllPostData();
  allPosts?.map(post => {
    if (post.tags) {
      const tagArray = post.tags.split(",");
      tagArray.map(each =>
        tags.push({
          label: each.trim().toLowerCase(),
          locale: post.locale,
        }),
      );
    }
  });
  // remove same tags with same locales
  return tags.filter((tag, index) => {
    return tags.findIndex(t => t.label === tag.label && t.locale === tag.locale) === index;
  });
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

const renderHTMLfromMarkdownString = async (markdownString, isBlog, locale) => {
  return remark()
    .use(remarkGfm) // github flavored markdown
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeToc, { customizeTOC: toc => blogTOC(toc, isBlog, locale) })
    .use(rehypeAutolinkHeadings, { behavior: "wrap" })
    .use(rehypeExternalLinks, {
      target: "_blank",
      rel: "noopener",
    })
    .use(rehypeGist, {
      replaceParentParagraph: true,
      omitCodeBlocks: true,
      classNames: [`border-0`, `my-2`, `not-prose`],
    })
    .use(rehypeShiki, {
      themes: {
        light: "one-light",
        dark: "github-dark-default",
      },
      transformers: [transformerMetaHighlight({ matchAlgorithm: "v3" })],
    })
    .use(rehypeVideo, { details: false })
    .use(rehypeFigure)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdownString);
};
