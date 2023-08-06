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
import rehypeHighlight from "rehype-highlight";
import rehypeVideo from "rehype-video";
import rehypeExternalLinks from "rehype-external-links";
import { fromHtml } from "hast-util-from-html";
import config from "./config.mjs";

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
  const mdPostNames = fs.readdirSync(mdDirectory);
  const mdPostsData = mdPostNames
    .filter(fileName => fileName.includes(".md"))
    .map(mdPostName => {
      const id = mdPostName.replace(/\.md$/, "");
      const fullPath = path.join(mdDirectory, mdPostName);
      const mdContent = fs.readFileSync(fullPath, "utf8");
      const matterResult = matter(mdContent);
      return {
        id,
        ...matterResult.data,
        content: matterResult.content,
      };
    });
  return mdPostsData.sort(sortByDate).filter(filterVisibility);
};

export const getMdContentById = (id, mdDirectory) => {
  // default using the `./posts` for markdown directory
  if (!mdDirectory) {
    mdDirectory = defaultMarkdownDirectory;
  }
  const isBlog = mdDirectory === defaultMarkdownDirectory; // if the markdown is blog article
  const mdPostNames = fs.readdirSync(mdDirectory);
  const mdPostsData = mdPostNames
    .filter(name => name === id + ".md")
    .map(async mdPostName => {
      const fullPath = path.join(mdDirectory, mdPostName);
      const mdContent = fs.readFileSync(fullPath, "utf8");
      const matterResult = matter(mdContent);
      const htmlResult = await renderHTMLfromMarkdownString(
        matterResult.content,
        isBlog,
      );
      return {
        id,
        author: config.authorName, // dafult authorName
        // content: matterResult.content, // original markdown string
        htmlStringContent: isBlog ? "" : htmlResult.value, // rendered html
        htmlAst: isBlog
          ? fromHtml(htmlResult.value, {
              fragment: true,
            })
          : {}, // only output ast if it's a blog post
        ...matterResult.data, // other details like date, title...
      };
    });
  return mdPostsData[0];
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

const blogTOC = (toc, isBlog) => {
  if (isBlog && config.enableToC && toc.children[0]?.children[0]) {
    return {
      type: "element",
      tagName: "details",
      children: [
        {
          type: "element",
          tagName: "summary",
          children: [{ type: "text", value: "Table of Contents" }],
        },
        toc,
      ],
    };
  } else {
    return null;
  }
};

const renderHTMLfromMarkdownString = async (markdownString, isBlog) => {
  return remark()
    .use(remarkGfm) // github flavored markdown
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeToc, { customizeTOC: toc => blogTOC(toc, isBlog) })
    .use(rehypeAutolinkHeadings, { behavior: "wrap" })
    .use(rehypeExternalLinks, {
      target: "_blank",
      rel: "noopener",
    })
    .use(rehypeHighlight)
    .use(rehypeVideo, { details: false })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdownString);
};
