import cfg from "../lib/config.mjs";
import { useEffect, useRef } from "react";
export default function Comments() {
  const ref = useRef();
  useEffect(() => {
    const scriptElement = document.createElement("script");
    scriptElement.async = true;
    scriptElement.crossOrigin = "anonymous";
    scriptElement.src = "https://giscus.app/client.js";
    scriptElement.setAttribute("data-repo", `${cfg.github}/${cfg.commentRepo}`);
    scriptElement.setAttribute("data-repo-id", cfg.commentRepoId);
    scriptElement.setAttribute("data-category-id", cfg.commentCategoryId);
    scriptElement.setAttribute("data-mapping", "title");
    scriptElement.setAttribute("data-strict", "0");
    scriptElement.setAttribute("data-reactions-enabled", "1");
    scriptElement.setAttribute("data-emit-metadata", "0");
    scriptElement.setAttribute("data-theme", "preferred-color-scheme");
    scriptElement.setAttribute("data-loading", "lazy");
    scriptElement.setAttribute("data-input-position", "bottom");
    ref.current?.appendChild(scriptElement);
  }, []);
  return <div className="mx-2" ref={ref} />;
}
