"use client";

import { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { scheduleIdle } from "../lib/schedule-idle";

const embedLoaders = {
  bilibili: () => import("./bilibili"),
  douban: () => import("./douban"),
  github: () => import("./github"),
  trade: () => import("./trade"),
  tweet: () => import("./twitter"),
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
    const hydratedNodes = new WeakSet();
    const scheduledHydrations = [];
    // Reuse the same dynamic import promise for embeds of the same type.
    const componentPromises = new Map();
    let disposed = false;
    let observer;

    const hydrateNode = async node => {
      if (disposed || hydratedNodes.has(node)) {
        return;
      }

      hydratedNodes.add(node);

      const embedType = node.getAttribute("data-embed");
      const loadComponent = embedLoaders[embedType];

      if (!loadComponent) {
        return;
      }

      try {
        const props = JSON.parse(node.getAttribute("data-props") || "{}");
        if (!componentPromises.has(embedType)) {
          componentPromises.set(embedType, loadComponent());
        }
        const { default: EmbedComponent } = await componentPromises.get(embedType);

        if (disposed) return;

        const root = createRoot(node);
        root.render(<EmbedComponent {...props} />);
        mountedRoots.push(root);
      } catch (error) {
        console.warn(`hydrate embed failed: ${embedType}`, error);
      }
    };

    const scheduleHydration = node => {
      if (hydratedNodes.has(node)) {
        return;
      }

      // Push non-critical hydration out of the initial article render.
      const cancel = scheduleIdle(
        () => {
          hydrateNode(node);
        },
        { timeout: 2000 },
      );
      scheduledHydrations.push(cancel);
    };

    if (typeof IntersectionObserver === "undefined") {
      nodes.forEach(scheduleHydration);
    } else {
      // Start hydrating shortly before the embed scrolls into view.
      observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (!entry.isIntersecting) {
              return;
            }

            observer?.unobserve(entry.target);
            scheduleHydration(entry.target);
          });
        },
        { rootMargin: "800px 0px" },
      );

      nodes.forEach(node => observer.observe(node));
    }

    return () => {
      disposed = true;
      observer?.disconnect();
      scheduledHydrations.forEach(cancel => cancel());
      setTimeout(() => {
        mountedRoots.forEach(root => root.unmount());
      }, 0);
    };
  }, [containerRef]);

  return null;
}
