import Blog from "../../components/blog";
import Image from "next/image";
import cfg from "../../lib/config.mjs";
import Bilibili from "../../components/bilibili";
import Douban from "../../components/douban";
import GitHub from "../../components/github";
import demoPic from "../../public/images/the1975.jpg";
import { useSpring, animated } from "@react-spring/web";

export const blogProps = {
  author: cfg.authorName,
  title: "Example",
  date: "2022-08-26",
  someKey: "someValeInJSXProps",
  tags: "example, test, jsx",
  visible: true,
};

export default function Example() {
  const springs = useSpring({
    from: { background: "#ff6d6d", y: 0, x: -100 },
    to: [
      { x: -50, background: "#fff59a" },
      { x: 0, background: "#88DFAB" },
      { x: 50, background: "#569AFF" },
      { x: 100, background: "#ff6d6d" },
    ],
    loop: true,
  });

  return (
    <Blog {...blogProps}>
      <h2>Animation</h2>
      <div className="w-full flex items-center justify-center">
        <animated.div
          style={{
            width: 40,
            height: 40,
            // background: '#222222',
            borderRadius: 6,
            ...springs,
          }}
        />
      </div>
      <p>
        This page is fully rendered by <code>JSX</code>. You can update this
        page with JavaScript and React components.
      </p>
      <p>
        Image example: <code>{"<Image />"}</code>
      </p>
      <div className="filter dark:brightness-75 ">
        <Image src={demoPic} alt={"Demo image"} />
      </div>
      <p>Movie example: (CSR)</p>
      <Douban id="3205624" />
      <p>GitHub Repo Example: (CSR)</p>
      <GitHub user="vercel" repo="next.js" />
      <p>Video example:</p>
      <Bilibili bv="BV1ys411a7Wu" />
      <br className="mt-4" />
    </Blog>
  );
}
