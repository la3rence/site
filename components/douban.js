/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import Skeleton from "./loading";

export default function Douban({ id, reverse }) {
  const [movie, setMovie] = useState(null);

  useEffect(() => {
    const fetchMovie = async id => {
      const res = await fetch(`https://moviedb.lawrenceli.me/data/${id}.json`, {
        cache: "force-cache",
      });
      const json = await res.json();
      setMovie(json);
    };
    fetchMovie(id).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!movie) {
    return <Skeleton />;
  }

  return (
    <div
      className={`flex h-36 my-4 max-w-4xl mx-auto border dark:border-none dark:bg-black ${reverse ? "flex-row-reverse" : ""}`}
    >
      <div className="w-2/3 flex flex-col px-4  ">
        <div className="truncate py-2 flex">
          {movie.title} {movie.original_title}
        </div>
        <div className="text-sm flex-1 text-gray-500 overflow-hidden text-ellipsis">
          {movie.intro?.substring(0, 100) + "..."}
        </div>
        <div className="text-sm truncate py-2">
          <a
            href={movie.url}
            className="no-underline text-gray-500"
            rel="noopener noreferrer"
            target="_blank"
          >
            <span className="bg-[#072] text-white p-[1px] rounded-xs mr-2">豆</span>
            <span>{movie.url}</span>
          </a>
        </div>
      </div>
      {movie.pic && (
        <div className="w-1/3 not-prose">
          <img
            className="object-cover w-full h-full"
            src={`${process.env.NEXT_PUBLIC_PROXY_URL}${movie.pic.large?.replace("https://", "")}`}
            alt={`${movie.title} 评分: ${movie.rating.value}`}
            title={`《${movie.title}》 评分: ${movie.rating.value}`}
          />
        </div>
      )}
    </div>
  );
}
