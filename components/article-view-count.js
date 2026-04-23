import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { scheduleIdle } from "../lib/schedule-idle";

const getRoutePath = asPath => {
  return asPath.split("?")[0].split("#")[0];
};

export default function ArticleViewCount({ translations }) {
  const router = useRouter();
  const [viewCount, setViewCount] = useState(0);

  useEffect(() => {
    const routePath = getRoutePath(router.asPath);
    let disposed = false;
    let cancelIdle;

    const fetchViewCount = async () => {
      try {
        const res = await fetch(`/api/view?page=${routePath}`);
        if (!res.ok) {
          throw new Error(`view fetch failed: ${res.status}`);
        }
        const data = await res.json();
        if (!disposed) {
          setViewCount(data?.count ?? 0);
        }
      } catch (error) {
        if (!disposed) {
          setViewCount(0);
        }
        console.warn("article view fetch failed", routePath, error);
      }
    };

    // Delay the request so article content and main interactions win first.
    const timerId = setTimeout(() => {
      // The view-count request is secondary UI, so run it after more important work.
      cancelIdle = scheduleIdle(
        () => {
          if (!disposed) fetchViewCount();
        },
        { timeout: 4000 },
      );
    }, 5000);

    return () => {
      disposed = true;
      clearTimeout(timerId);
      cancelIdle?.();
    };
  }, [router.asPath]);

  if (viewCount <= 10) {
    return null;
  }

  return (
    <small>
      {viewCount} {translations["views"]}
    </small>
  );
}
