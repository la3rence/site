import Link from "next/link";

const A = props => {
  return (
    <Link
      {...props}
      className="no-underline hover:underline text-zinc-500 font-normal cursor-pointer"
      target={props.self ? "_self" : "_blank"}
    />
  );
};

export default A;
