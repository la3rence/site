import Link from "next/link";
import { SocialIcon } from "react-social-icons";

const A = props => {
  return (
    <Link
      {...props}
      className="no-underline text-gray-400 font-normal"
      target={props.self ? "_self" : "_blank"}
    />
  );
};

export const Icon = props => {
  return (
    <SocialIcon
      {...props}
      style={{ height: 35, width: 35 }}
      className="cursor-pointer"
      bgColor="transparent"
      fgColor="#777"
      target={"_blank"}
    />
  );
};
export default A;
