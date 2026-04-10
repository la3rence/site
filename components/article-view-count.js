import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const getRoutePath = asPath => {
  return asPath.split("?")[0].split("#")[0];
};

export default function ArticleViewCount({ translations }) {
  const router = useRouter();
  const [viewCount, setViewCount] = useState(0);

  useEffect(() => {
    const routePath = getRoutePath(router.asPath);
    let disposed = false;

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

    fetchViewCount();

    return () => {
      disposed = true;
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
