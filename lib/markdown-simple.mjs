import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";

const renderer = remark()
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeStringify);

export const renderMarkdown = async md => {
  const result = await renderer.process(md);
  return String(result);
};
