import Head from "next/head";
import Link from "next/link";
import config from "../lib/config.json";

export default function Header() {
  const { blogTitle, authorTwitter, authorGithub } = config;
  return (
    <>
      <Head>
        {/* <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" /> */}
      </Head>
      <header className="flex mx-6 my-6 text-gray-500">
        <h2 className="w-28">
          <a href={"/"}>
            <div className="rounded bg-gray-100 text-gray-700 dark:bg-opacity-0 dark:text-gray-300 p-2 -mx-2">
              {blogTitle}
            </div>
          </a>
        </h2>
        <div className="flex-1"></div>
        <div className="flex-4 flex items-center">
          <ul className="flex">
            <li className="px-3">
              <Link href={"/"}>Blog</Link>
            </li>
            {authorTwitter && (
              <li className="px-3">
                <Link href={authorTwitter}>Twitter</Link>
              </li>
            )}
            {authorGithub && (
              <li className="px-3">
                <Link href={authorGithub}>Github</Link>
              </li>
            )}
          </ul>
        </div>
      </header>
    </>
  );
}
