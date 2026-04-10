"use client";

import { useEffect } from "react";
import { createRoot } from "react-dom/client";

const embedLoaders = {
  bilibili: () => import("./bilibili"),
  douban: () => import("./douban"),
  github: () => import("./github"),
  trade: () => import("./trade"),
  tweet: () => import("./twitter"),
};

export default function EmbedHydrator({ containerRef }) {
  useEffect(() => {
    const container = containerRef.current;
    let disposed = false;

    if (!container) {
      return;
    }

    const mountedRoots = [];
    const nodes = [...container.querySelectorAll("[data-embed]")];

    const hydrateEmbeds = async () => {
      await Promise.all(
        nodes.map(async node => {
          const embedType = node.getAttribute("data-embed");
          const loadComponent = embedLoaders[embedType];

          if (!loadComponent) {
            return;
          }

          try {
            const props = JSON.parse(node.getAttribute("data-props") || "{}");
            const { default: EmbedComponent } = await loadComponent();

            if (disposed) {
              return;
            }

            const root = createRoot(node);
            root.render(<EmbedComponent {...props} />);
            mountedRoots.push(root);
          } catch (error) {
            console.warn(`hydrate embed failed: ${embedType}`, error);
          }
        }),
      );
    };

    hydrateEmbeds();

    return () => {
      disposed = true;
      setTimeout(() => {
        mountedRoots.forEach(root => root.unmount());
      }, 0);
    };
  }, [containerRef]);

  return null;
}
