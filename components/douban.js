/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import StarRating from "react-star-ratings";
import useSWR from "swr";
import Skeleton, { fetcher, swrConfig } from "./loading";

export default function Douban({ id, reverse }) {
  const [mounted, setMounted] = useState(false);

  const { data: movie, error } = useSWR(
    mounted ? `https://douban.8610000.xyz/data/${id}.json` : null,
    fetcher,
    swrConfig
  );
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!movie || error) {
    return <Skeleton />;
  }

  return (
    <div
      className={`flex h-36 cursor-pointer border my-4 dark:border-gray-500 shadow-lg 
      ${reverse ? "flex-row-reverse" : ""}`}
    >
      <div className="w-2/3 flex flex-col px-4">
        <div className="truncate py-2 flex">
          {movie.title} {movie.original_title}
          {movie.rating && (
            <>
              <span className="flex-1"></span>
              <span>
                <StarRating
                  rating={movie.rating.value / 2}
                  starRatedColor="orange"
                  numberOfStars={5}
                  starDimension="18px"
                  starSpacing="0px"
                  name={movie.title}
                ></StarRating>
              </span>
            </>
          )}
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
            <span className="bg-[#072] text-white p-[1px] rounded-sm mr-2">
              豆
            </span>
            <span>{movie.url}</span>
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
