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
import rehypeWrap from "rehype-wrap-all";
import rehypeDocument from "rehype-document";
import rehypeVideo from "rehype-video";

const mdDirectory = path.join(process.cwd(), "posts");
const jsDirectory = path.join(process.cwd(), "pages/blog");

export const getMdPostsData = () => {
  const mdPostNames = fs.readdirSync(mdDirectory);
  const mdPostsData = mdPostNames.map(mdPostName => {
    const id = mdPostName.replace(/\.md$/, "");
    const fullPath = path.join(mdDirectory, mdPostName);
    const mdContent = fs.readFileSync(fullPath, "utf8");
    const matterResult = matter(mdContent);
    return {
      id,
      ...matterResult.data,
    };
  });
  return mdPostsData;
};

export const getMdContent = id => {
  const mdPostNames = fs.readdirSync(mdDirectory);
  const mdPostsData = mdPostNames
    .filter(name => name === id + ".md")
    .map(async mdPostName => {
      const fullPath = path.join(mdDirectory, mdPostName);
      const mdContent = fs.readFileSync(fullPath, "utf8");
      const matterResult = matter(mdContent);
      const marginPatch = "-mx-patch";
      const htmlResult = await remark()
        .use(remarkGfm) // github flavored markdown
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeDocument)
        .use(rehypeSlug)
        .use(rehypeAutolinkHeadings, { behavior: "wrap" })
        .use(rehypeHighlight)
        .use(rehypeVideo, { details: false })
        // wrap some DOMs for -margin-x style
        .use(rehypeWrap, [
          { selector: "img", wrapper: "div." + marginPatch },
          { selector: "pre", wrapper: "div." + marginPatch },
          { selector: "table", wrapper: "div." + marginPatch },
          { selector: "video", wrapper: "div." + marginPatch },
        ])
        .use(rehypeStringify)
        .process(matterResult.content);
      return {
        // content: matterResult.content, // original markdown string
        htmlStringContent: htmlResult.value, // rendered html
        ...matterResult.data, // other details like date, title...
      };
    });
  return mdPostsData[0];
};

const getJsPostsData = async () => {
  const jsPostNames = fs.readdirSync(jsDirectory);
  // filter out the index and [id] from names
  const ids = jsPostNames
    .filter(
      name =>
        name.endsWith(".js") ||
        name.endsWith(".ts") ||
        name.endsWith(".jsx") ||
        name.endsWith(".tsx")
    )
    .map(name => name.replace(/\.js$/, ""))
    .filter(name => name !== "[id]" && name !== "index");
  const jsPostData = await Promise.all(
    ids.map(async id => {
      // webpack only support this certain format like string. not variable
      const postModule = await import(`../pages/blog/${id}.js`);
      let { title, date, author } = postModule;
      // if (!author) {
      //   author = meta.authorName;
      // }
      return {
        id,
        title,
        date,
        author,
      };
    })
  );
  return jsPostData;
};

export const getAllPostData = async () => {
  const mdPostsData = getMdPostsData();
  const jsPostsData = await getJsPostsData();
  const all = [...mdPostsData, ...jsPostsData];
  // sort by date
  all.sort((a, b) => {
    if (a.date < b.date) {
      return 1;
    } else {
      return -1;
    }
  });
  return all;
};
