"use client";

import { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";

const embedLoaders = {
  bilibili: () => import("./bilibili"),
  douban: () => import("./douban"),
  github: () => import("./github"),
  trade: () => import("./trade"),
  tweet: () => import("./twitter"),
};

const scheduleIdle = fn => {
  if (typeof requestIdleCallback !== "undefined") {
    requestIdleCallback(fn, { timeout: 2000 });
  } else {
    setTimeout(fn, 0);
  }
};

export default function EmbedHydrator({ containerRef }) {
  const hydratedRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;

    if (!container || hydratedRef.current) {
      return;
    }

    hydratedRef.current = true;

    const nodes = [...container.querySelectorAll("[data-embed]")];
    if (nodes.length === 0) return;

    const mountedRoots = [];
    let disposed = false;

    scheduleIdle(() => {
      if (disposed) return;

      const hydrateEmbeds = async () => {
        await Promise.all(
          nodes.map(async node => {
            const embedType = node.getAttribute("data-embed");
            const loadComponent = embedLoaders[embedType];

            if (!loadComponent) return;

            try {
              const props = JSON.parse(node.getAttribute("data-props") || "{}");
              const { default: EmbedComponent } = await loadComponent();

              if (disposed) return;

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
    });

    return () => {
      disposed = true;
      setTimeout(() => {
        mountedRoots.forEach(root => root.unmount());
      }, 0);
    };
  }, [containerRef]);

  return null;
}
