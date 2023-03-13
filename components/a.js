import Link from "next/link";

const A = props => {
  return (
    <Link
      {...props}
      className="no-underline text-zinc-600 dark:text-zinc-400 font-normal cursor-pointer"
      target={props.self ? "_self" : "_blank"}
    />
  );
};

export default A;
