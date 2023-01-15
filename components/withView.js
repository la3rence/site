import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import config from "../lib/config.mjs";

// eslint-disable-next-line react/display-name
const withView = Component => props => {
  // skip this HOC by: return <Component {...props} />;
  const id = useRouter().asPath.split("?")[0].split("#")[0];
  const [view, setView] = useState(0);
  const [pageURL, setPageURL] = useState(config.baseURL + id);

  useEffect(() => {
    setPageURL(window.location.href.split("?")[0].split("#")[0]);
    getViews(id);
  }, [id]);

  const getViews = async id => {
    const res = await (await fetch(`/api/view?page=${id}`)).json();
    setView(res.view);
    console.debug(`page: ${id} view: ${res.view}`);
  };
  const withViewProps = {
    ...props,
    id,
    view,
    pageURL,
    domain: new URL(pageURL).hostname,
  };
  return <Component {...withViewProps} />;
};

// HOC
// component wrapped by this function will have `id`, `view` from `props`
export default withView;
