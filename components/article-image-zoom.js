import { useEffect } from "react";

export default function ArticleImageZoom({ containerRef }) {
  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    let zoom;
    let disposed = false;
    const startZoom = async () => {
      const { default: mediumZoom } = await import("medium-zoom");

      if (disposed) {
        return;
      }

      zoom = mediumZoom(container.querySelectorAll("figure>img"), {
        background: "rgba(0,0,0,0.3)",
      });
    };

    const timer = setTimeout(() => {
      startZoom();
    }, 1000);

    return () => {
      disposed = true;
      clearTimeout(timer);
      zoom?.detach();
    };
  }, [containerRef]);

  return null;
}
