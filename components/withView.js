import { useEffect, useState } from "react";
import { useRouter } from "next/router";

// eslint-disable-next-line react/display-name
const withView = Component => props => {
  // skip this HOC by: return <Component {...props} />;

  const { asPath: id } = useRouter();
  const [view, setView] = useState(0);

  useEffect(() => {
    getViews(id);
  }, [id]);

  const getViews = async id => {
    const res = await (await fetch(`/api/view?page=${id}`)).json();
    setView(res.view);
    console.debug(`page: ${id} view: ${res.view}`);
  };
  const withViewProps = { ...props, id, view };
  return <Component {...withViewProps} />;
};

// HOC
// component wrapped by this function will have `id`, `view` from `props`
export default withView;
