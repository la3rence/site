/* eslint-disable jsx-a11y/alt-text */
import { Tweet } from "react-tweet";
import Image from "next/image";

const components = {
  AvatarImg: props => <Image {...props} />,
  MediaImg: props => <Image {...props} fill unoptimized />,
};
export default function Twitter({ id }) {
  return (
    <div className="not-prose flex justify-center">
      <Tweet id={id} apiUrl={`/api/tweet?id=${id}`} components={components} />
    </div>
  );
}
