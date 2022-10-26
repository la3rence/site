/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";

export default function Douban(props) {
  const [movie, setMovie] = useState({ intro: "Loading..." });

  useEffect(() => {
    const fetchMovie = async id => {
      const res = await fetch(`https://douban.8610000.xyz/data/${id}.json`);
      const json = await res.json();
      setMovie(json);
      // console.log(json);
    };
    fetchMovie(props.id).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-36 cursor-pointer border my-4 dark:border-gray-500 shadow-lg">
      <div className="flex flex-col px-4 w-2/3">
        <div className="truncate py-2">
          {movie.title} {movie.original_title}
        </div>
        <div className="text-sm flex-1 text-gray-500 overflow-hidden text-ellipsis">
          {movie.intro}
        </div>
        <div className="text-sm truncate py-2">
          <a
            href={movie.url}
            className="no-underline text-gray-500"
            target="_blank"
          >
            <span className="bg-[#072] text-white mr-2 p-[1px] rounded-sm">
              豆
            </span>
            {movie.url}
          </a>
        </div>
      </div>
      {movie.pic && (
        <div className="w-1/3 not-prose">
          <img
            className="object-cover w-full h-full"
            src={movie.pic.large}
            alt={`${movie.title} 评分: ${movie.rating.value}`}
            title={`《${movie.title}》 评分: ${movie.rating.value}`}
          />
        </div>
      )}
    </div>
  );
}
