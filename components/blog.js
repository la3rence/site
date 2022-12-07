import Image from "next/image";
import Link from "next/link";
import Layout from "./layout";
import withView from "./withView";
import { useEffect, useState } from "react";
import "highlight.js/styles/github-dark.css";
import config from "../lib/config.json";
import Tag from "./tag";

export default withView(props => {
  const { children, title, date, author, view, id, vertical, tag } = props;
  // allow default vertical article chage back to normal style
  const [clientVertical, setClentVertical] = useState(vertical);
  // like button
  const [like, setLike] = useState(0);
  const reverseVertical = () => {
    if (vertical) {
      setClentVertical(!clientVertical);
    }
  };

  useEffect(() => {
    getLikes(id);
  }, [id]);

  const getLikes = async id => {
    const res = await (await fetch(`/api/like?page=${id}`)).json();
    setLike(res.likeCount);
  };

  const addLike = async () => {
    const res = await (
      await fetch(`/api/like?page=${id}`, { method: "POST" })
    ).json();
    setLike(res.likeCount);
    console.log(`page: ${id} like: ${res.likeCount}`);
  };

  return (
    <Layout blog {...props} vertical={clientVertical}>
      <div className={`blog ${clientVertical ? "vertical" : ""}`} id={id}>
        <h2
          id="title"
          className="articleTitle cursor-pointer mt-28"
          onClick={reverseVertical}
        >
          {title}
        </h2>
        {!props.noMeta && (
          <div className="articleTitle flex justify-start items-center flex-wrap mb-8">
            <div
              className="flex flex-2 items-center justify-center cursor-pointer rounded-lg
           hover:bg-gray-300 dark:hover:bg-gray-700 dark:text-gray-300 pr-2"
            >
              <Link href={"/"} className="no-underline p-1">
                <div className="flex items-center justify-start flex-wrap not-prose">
                  <Image
                    className="rounded-full"
                    src={`/images/author/${author}.png`}
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
            <div className="justify-end">
              {view > 0 && !clientVertical && <small>{view} views</small>}
            </div>
          </div>
        )}
        <div className="article">{children}</div>
      </div>
      {!props.noMeta && <div className="mx-2 mt-10 flex flex-nowrap">
        {config.enableLike && (
          <div className="flex-1">
            <button
              className="w-14 text-sm p-1 border-yellow-300 rounded-lg hover:bg-yellow-200 dark:hover:bg-gray-600 transition duration-300"
              onClick={addLike}
            >
              👍 {like > 0 && like}
            </button>
          </div>
        )}
        <div id="tag">
          {tag && tag.split(",").map(each => <Tag tag={each} key={each} />)}
        </div>
      </div>}
    </Layout>
  );
});
