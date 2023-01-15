import { useEffect, useState } from "react";
import { SocialIcon } from "react-social-icons";

const languageColorMapping = {
  Java: "bg-[#b07219]",
  Go: "bg-[#00ADD8]",
  JavaScript: "bg-[#f1e05a]",
};

export default function GitHub(props) {
  const [data, setData] = useState({});

  useEffect(() => {
    const getGitHubRepo = async (user, repo) => {
      const res = await fetch(`https://api.github.com/repos/${user}/${repo}`);
      const data = await res.json();
      console.debug("GitHub API", data);
      setData(data);
    };
    getGitHubRepo(props.user, props.repo);
  }, []);

  return (
    <div className="border border-zinc-500 my-5 flex items-center">
      <div className="flex-1">
        <p className="my-1">
          📔{" "}
          <a href={data.html_url} target="_blank">
            {data.name}
          </a>
          <span className="ml-2 rounded-full border border-zinc-500 text-xs px-1">
            {data.is_template ? "Public template" : "Public"}
          </span>
        </p>
        <p className="my-3 text-sm">{data.description}</p>
        <p className="my-2 text-sm">
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
