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

    const fetchViewCount = async () => {
      const res = await fetch(`/api/view?page=${routePath}`);
      const data = await res.json();
      setViewCount(data?.count ?? 0);
    };

    fetchViewCount();
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
