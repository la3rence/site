import { useEffect, useState } from "react";
import { SocialIcon } from "react-social-icons";
import Skeleton, { fetcher, swrConfig } from "./loading";
import useSWR from "swr";

const languageColorMapping = {
  Java: "bg-[#b07219]",
  Go: "bg-[#00ADD8]",
  JavaScript: "bg-[#f1e05a]",
  TypeScript: "bg-[#3178c6]",
};

export default function GitHub({ user, repo }) {
  const [mounted, setMounted] = useState(false);
  const { data, error } = useSWR(
    mounted ? `https://api.github.com/repos/${user}/${repo}` : null,
    fetcher,
    swrConfig
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  if (error || !data) {
    return <Skeleton />;
  }

  return (
    <div className="border border-zinc-500 my-6 flex items-center shadow-lg">
      <div className="flex-1">
        <p className="my-2">
          <span className="mr-1">📔</span>
          <a href={data.html_url} target="_blank">
            {data.name}
          </a>
          <span className="ml-2 rounded-full border border-zinc-500 text-xs px-1">
            {data.is_template ? "Public template" : "Public"}
          </span>
        </p>
        <p className="my-3 text-sm">{data.description}</p>
        <p className="my-3 text-sm">
          {data && (
            <span
              className={`w-3 h-3 inline-block rounded-full mr-1 ${
                languageColorMapping[data.language]
              }`}
            ></span>
          )}
          <span>{data.language}</span>
          <span className="mx-5">🌟 {data.watchers}</span>
          <span>🛠 {data.forks}</span>
        </p>
      </div>
      <div className="w-32 h-28">
        <SocialIcon
          network="github"
          style={{ height: 112, width: 112 }}
          fgColor="rgba(96, 96, 96)"
          bgColor="transparent"
        ></SocialIcon>
      </div>
    </div>
  );
}
