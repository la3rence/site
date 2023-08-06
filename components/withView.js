import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import config from "../lib/config.mjs";

// eslint-disable-next-line react/display-name
const withView = Component => props => {
  // skip this HOC by: return <Component {...props} />;
  const id = useRouter().asPath.split("?")[0].split("#")[0];
  const [pageURL, setPageURL] = useState(config.baseURL + id);
  const [data, setData] = useState({});

  useEffect(() => {
    setPageURL(window.location.href.split("?")[0].split("#")[0]);
    const postView = async () => {
      const res = await fetch(`/api/view?page=${id}`);
      const data = await res.json();
      setData(data);
    };
    postView();
  }, [id]);

  const withViewProps = {
    ...props,
    id,
    view: data ? data.count : 0,
    pageURL,
    domain: new URL(pageURL).hostname,
  };
  return <Component {...withViewProps} />;
};

// HOC
// component wrapped by this function will have `id`, `view` from `props`
export default withView;
