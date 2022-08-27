import Layout from "./layout";
import NextImage from "next/image";
import Link from "next/link";
import "highlight.js/styles/github-dark.css";

export default function Blog({ children, title, date, author, id }) {
  return (
    <Layout blog title={title}>
      <div className="blog" id={id}>
        <h3>{title}</h3>
        <div className="flex h-7 justify-start items-center flex-wrap">
          <div className="flex flex-2 items-center justify-center cursor-pointer">
            <Link href={"/about"}>
              <div className="flex items-center justify-start flex-wrap">
                <NextImage
                  className="rounded-full"
                  src={`/images/author/${author}.jpg`}
                  width={25}
                  height={25}
                  alt={author}
                ></NextImage>
                <small className="px-2">{author}</small>
                <small className="before:content-['/'] before:pr-2">
                  {date}
                </small>
              </div>
            </Link>
          </div>
          <div className="flex-1"></div>
          <div className="pr-2 flex justify-end">
            {/* <small>1,234 Views</small> */}
          </div>
        </div>
        <div className="article pt-3">{children}</div>
      </div>
    </Layout>
  );
}
