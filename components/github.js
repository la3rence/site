import { useEffect, useState } from "react";
import Skeleton from "./loading";
import { GitHubIcon } from "./svg";

const languageColorMapping = {
  "C++": "bg-[#f34b7d]",
  Java: "bg-[#b07219]",
  Go: "bg-[#00ADD8]",
  JavaScript: "bg-[#f1e05a]",
  TypeScript: "bg-[#3178c6]",
  Python: "bg-[#3572A5]",
};

export default function GitHub({ user, repo }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    const getGitHubRepo = async (user, repo) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_PROXY_URL}api.github.com/repos/${user}/${repo}`,
      );
      const data = await res.json();
      setData(data);
    };
    getGitHubRepo(user, repo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!data) {
    return <Skeleton />;
  }

  return (
    <div className="my-4 flex items-center border-t border-b border-zinc-100 dark:border-zinc-800  dark:bg-black">
      <div className="flex-1">
        <p className="my-2">
          <span className="mr-1 h-5 w-5">
            <GitHubIcon style={{ height: 20, width: 20 }} />
          </span>
          <a href={data.html_url} target="_blank" rel="noopener noreferrer">
            {data.full_name}
          </a>
          <span className="ml-2 rounded-full border border-zinc-500 text-xs px-1">Public</span>
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
      {/* <div className="w-28 h-24">
        <GitHubIcon style={{ height: 84, width: 84 }} />
      </div> */}
    </div>
  );
}
