import Image from "next/image";
import Link from "next/link";
import Layout from "./layout";
import withView from "./withView";
import { useState } from "react";
import "highlight.js/styles/github-dark.css";

export default withView(props => {
  const { children, title, date, author, view, id, vertical } = props;
  // allow default vertical article chage back to normal style
  const [clientVertical, setClentVertical] = useState(vertical);
  const reverseVertical = () => {
    if (vertical) {
      setClentVertical(!clientVertical);
    }
  };

  return (
    <Layout blog {...props} vertical={clientVertical}>
      <div className={`blog mt-9 ${clientVertical ? "vertical" : ""}`} id={id}>
        <h3
          id="title"
          className="articleTitle cursor-pointer"
          onClick={reverseVertical}
        >
          {title}
        </h3>
        <div className="articleTitle flex justify-start items-center flex-wrap mb-8">
          <div className="flex flex-2 items-center justify-center cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700 dark:text-gray-300 pr-2">
            <Link href={"/"} className="no-underline py-2">
              <div className="flex items-center justify-start flex-wrap not-prose">
                <Image
                  className="rounded-full"
                  src={`/images/author/${author}.jpg`}
                  width={25}
                  height={25}
                  alt={author}
                />
                <small className={`${clientVertical ? "mt-2" : "ml-2"}`}>
                  {author}
                </small>
                <small className="before:content-['/'] before:p-0 before:m-2">
                  {date}
                </small>
              </div>
            </Link>
          </div>
          <div className="flex-1" />
          <div className="flex justify-end">
            {view > 0 && !clientVertical && <small>{view} views</small>}
          </div>
        </div>
        <div className="article">{children}</div>
      </div>
    </Layout>
  );
});
