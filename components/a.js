import Link from "next/link";
import config from "../lib/config.mjs";

const A = props => {
  return (
    <Link
      {...props}
      className="no-underline hover:underline text-black dark:text-white font-normal cursor-pointer"
      target={props.self ? "_self" : "_blank"}
      locale={config.defaultLocale}
    />
  );
};

export default A;
