import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import rehypeVideo from "rehype-video";
import rehypeExternalLinks from "rehype-external-links";
import { fromHtml } from "hast-util-from-html";
import config from "./config.mjs";
import * as cheerio from "cheerio";

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
  const mdPostNames = fs.readdirSync(mdDirectory);
  const mdPostsData = mdPostNames
    .filter(name => name === id + ".md")
    .map(async mdPostName => {
      const fullPath = path.join(mdDirectory, mdPostName);
      const mdContent = fs.readFileSync(fullPath, "utf8");
      const matterResult = matter(mdContent);
      const htmlResult = await renderHTMLfromMarkdownString(
        matterResult.content
      );
      return {
        id,
        author: config.authorName, // dafult authorName
        // content: matterResult.content, // original markdown string
        htmlStringContent: htmlResult.value, // rendered html
        htmlAst: fromHtml(htmlResult.value, {
          fragment: true,
        }),
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
    })
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

// const formatTag = (tagString) => {
//   return tagString.trim().toLowerCase().replace("/", "-")
// }

const renderHTMLfromMarkdownString = async markdownString => {
  return remark()
    .use(remarkGfm) // github flavored markdown
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
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

const getPureTextFromMarkdown = async markdownString => {
  const html = (await renderHTMLfromMarkdownString(markdownString)).value;
  const $ = cheerio.load(html, { runScripts: "dangerously" });
  return $("p").text();
};

// returns post meta and context
export const searchByKeyword = async keyword => {
  const allPosts = await getMdPostsData();
  await Promise.all(
    allPosts.map(async post => {
      post["content"] = await getPureTextFromMarkdown(post.content);
    })
  );
  return search(keyword, allPosts, keyword.length * 3);
};

function search(keyword, allPosts, contextLength) {
  const results = {};
  for (const post of allPosts) {
    let match;
    let lastIndex = -1;
    const context = post.content;
    while ((match = findNext(keyword, context, lastIndex))) {
      const start = match.index;
      const end = match.index + keyword.length;
      // 找到所在位置的上下文
      const startContext = Math.max(0, start - contextLength);
      const endContext = Math.min(context.length, end + contextLength);
      const contextStr = context.slice(startContext, endContext);
      // 检查是否已经包含了同一篇文章中相近的位置
      let included = false;
      for (const { start: otherStart, end: otherEnd } of results[post.id] ||
        []) {
        const distance = Math.min(start - otherEnd, otherStart - end);
        if (distance > keyword.length) {
          included = true; // 相近
          break;
        }
      }
      // 如果还没有这个文章的结果，就创建一个空数组
      if (!results[post.id]) {
        results[post.id] = [];
      }
      // 如果没有相近的结果，就添加这个结果到数组里面
      if (!included) {
        results[post.id].push({
          match: match[0],
          context: contextStr,
          start,
          end,
        });
      }
      lastIndex = match.index + 1; // 从这里开始查找下一个匹配
    }
  }
  const finalResults = [];
  for (const post of allPosts) {
    if (results[post.id]) {
      const matches = results[post.id];
      // 将同一篇文章中的结果合并到一起
      let combined = combineMatches(matches);
      combined = combined.map(item => item.context).join("......");
      finalResults.push({
        id: post.id,
        title: post.title,
        contexts: `......${combined}......`.replace(
          new RegExp(keyword, "gi"),
          "<mark>" + keyword + "</mark>"
        ),
      });
    }
  }
  return finalResults;
}

// 找到 content 字符串中下一个与 keyword 匹配的位置
function findNext(keyword, content, lastIndex) {
  const re = new RegExp(keyword, "ig");
  re.lastIndex = lastIndex;
  return re.exec(content);
}
// 合并同一篇文章中的结果
function combineMatches(matches) {
  matches = matches.slice().sort((a, b) => a.start - b.start);
  const combined = [];
  let current;
  for (const match of matches) {
    if (!current || match.start > current.end) {
      // 如果没有交叉，就添加一个新的结果
      current = {
        match: match.match,
        context: match.context,
        start: match.start,
        end: match.end,
      };
      combined.push(current);
    } else {
      // 如果有交叉，就更新当前结果的 end
      current.end = match.end;
    }
  }
  return combined;
}
