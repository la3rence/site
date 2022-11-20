import Image from "next/image";
import Link from "next/link";
import Layout from "./layout";
import withView from "./withView";
import { useEffect, useState } from "react";
import "highlight.js/styles/github-dark.css";

export default withView(props => {
  const { children, title, date, author, view, id, vertical } = props;
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
    getLikes();
  }, [id]);

  const getLikes = async () => {
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
          <div className="flex justify-end">
            {view > 0 && !clientVertical && <small>{view} views</small>}
          </div>
        </div>
        <div className="article">{children}</div>
      </div>
      <div className="ml-4 mt-8">
        <button
          className="w-14 border border-gray-500 rounded-lg hover:bg-gray-500 transition duration-500"
          onClick={addLike}
        >
          👍 {like > 0 && like}
        </button>
      </div>
    </Layout>
  );
});
