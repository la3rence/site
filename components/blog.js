import Layout from "./layout";
import NextImage from "next/image";
import Link from "next/link";
import "highlight.js/styles/github-dark.css";

export default function Blog({ children, title, date, author }) {
  return (
    <>
      <Layout blog>
        <div className="blog mx-3 my-10">
          <h3>{title}</h3>
          <div className="flex h-7 justify-start items-center flex-wrap">
            <div className="flex flex-2 items-center justify-center cursor-pointer">
              <Link href={"/about"}>
                <div className="flex items-center justify-start flex-wrap">
                  <NextImage
                    className="rounded-full"
                    src="/images/lawrence.jpg"
                    width={25}
                    height={25}
                  ></NextImage>
                  <small className="pl-2">{author}</small>
                  <small className="pl-2">/</small>
                  <small className="pl-2">{date}</small>
                </div>
              </Link>
            </div>
            <div className="flex-1"></div>
            <div className="pr-2 flex justify-end">
              {/* <small>1,234 Views</small> */}
            </div>
          </div>
          <div className="article py-2">{children}</div>
        </div>
      </Layout>
    </>
  );
}
