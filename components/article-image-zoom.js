import { useEffect } from "react";
import { useTheme } from "next-themes";
import { scheduleIdle } from "../lib/schedule-idle";
import { createImageZoom } from "../lib/image-zoom";

export default function ArticleImageZoom({ containerRef }) {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    // Skip initialization entirely for text-only posts.
    const images = container.querySelectorAll("figure>img");
    if (images.length === 0) {
      return;
    }

    let zoom;
    let disposed = false;
    const startZoom = () => {
      if (disposed) {
        return;
      }

      zoom = createImageZoom(images, {
        background: resolvedTheme === "dark" ? "rgba(0,0,0,0.72)" : "rgba(255,255,255,0.68)",
        backdropFilter: resolvedTheme === "dark" ? "none" : "blur(18px) saturate(1.2)",
        maxScale: 1.35,
      });
    };

    // Keep zoom setup out of the critical path for article navigation.
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
  }, [containerRef, resolvedTheme]);

  return null;
}
