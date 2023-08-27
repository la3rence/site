import Link from "next/link";

const A = props => {
  return (
    <Link
      {...props}
      className="no-underline hover:underline text-black dark:text-white font-normal cursor-pointer"
      target={props.self ? "_self" : "_blank"}
    />
  );
};

export default A;
