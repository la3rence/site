import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import config from "../lib/config.mjs";
import useSWR from "swr";
import { fetcher, swrConfig } from "./loading";

// eslint-disable-next-line react/display-name
const withView = Component => props => {
  // skip this HOC by: return <Component {...props} />;
  const id = useRouter().asPath.split("?")[0].split("#")[0];
  const [pageURL, setPageURL] = useState(config.baseURL + id);
  const { data } = useSWR(`/api/view?page=${id}`, fetcher, swrConfig);

  useEffect(() => {
    setPageURL(window.location.href.split("?")[0].split("#")[0]);
  }, [id]);

  const withViewProps = {
    ...props,
    id,
    view: data ? data.view : 0,
    pageURL,
    domain: new URL(pageURL).hostname,
  };
  return <Component {...withViewProps} />;
};

// HOC
// component wrapped by this function will have `id`, `view` from `props`
export default withView;
