import { useEffect } from "react";
import { scheduleIdle } from "../lib/schedule-idle";

export default function ArticleImageZoom({ containerRef }) {
  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    // Skip the dynamic import entirely for text-only posts.
    const images = container.querySelectorAll("figure>img");
    if (images.length === 0) {
      return;
    }

    let zoom;
    let disposed = false;
    const startZoom = async () => {
      const { default: mediumZoom } = await import("medium-zoom");

      if (disposed) {
        return;
      }

      zoom = mediumZoom(images, {
        background: "rgba(0,0,0,0.3)",
      });
    };

    // Keep the zoom library out of the critical path for article navigation.
    const cancelIdle = scheduleIdle(
      () => {
        startZoom();
      },
      { timeout: 3000, fallbackDelay: 1200 },
    );

    return () => {
      disposed = true;
      cancelIdle();
      zoom?.detach();
    };
  }, [containerRef]);

  return null;
}
