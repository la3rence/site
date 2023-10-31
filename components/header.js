import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import config from "../lib/config.mjs";
import Logo from "./logo";
import { Adsense } from "./analytics";

export default function Header({
  title,
  blog,
  description,
  date,
  modified,
  themeColor,
}) {
  const router = useRouter();
  let {
    siteTitle,
    navItems,
    authorName,
    baseURL,
    siteDescription,
    twitter,
    enableAdsense,
  } = config;
  const theDescription = description || siteDescription;
  const pageTitle = title || siteTitle;
  const og = `${baseURL}/api/og?meta=${title},${themeColor?.replace("#", "")}`;
  const isoDate = date ? new Date(date).toISOString() : new Date("2020-01-01");
  const isoModifiedDate = modified ? new Date(modified).toISOString() : isoDate;
  const structuredData = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    image: [og],
    datePublished: isoDate,
    dateModified: isoModifiedDate,
    author: [
      {
        "@type": "Person",
        name: authorName,
        url: baseURL,
      },
    ],
  });
  const hoverTabStyle =
    "hover:bg-zinc-100 text-zinc-700 transition duration-500 dark:hover:bg-zinc-700 dark:text-zinc-300 hover:transition-transform";
  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="keywords" content={`${siteTitle}, ${authorName}, Blog`} />
        <meta name="Description" content={theDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:url" content={`${baseURL}${router.asPath}`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={siteTitle} />
        <meta property="og:description" content={theDescription} />
        <meta property="og:image" content={og} />
        <meta property="description" content={theDescription} />
        <meta name="twitter:title" content={`${pageTitle} (${twitter})`} />
        <meta name="twitter:image" content={og} />
        <meta name="twitter:creator" content={twitter} />
        <meta name="twitter:site" content={twitter} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="referrer" content="never" />
        {themeColor && (
          <meta
            name="theme-color"
            content={themeColor}
            media="(prefers-color-scheme: light)"
          />
        )}
        {enableAdsense && <Adsense />}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: structuredData }}
        />
      </Head>
      {!blog && (
        <header className="flex mt-12 text-zinc-500">
          <h1 className="w-32 cursor-pointer">
            <Link href={"/"}>
              <div className={`py-1 -mx-2 ${hoverTabStyle}`}>
                <Logo title={siteTitle} />
              </div>
            </Link>
          </h1>
          <div className="flex-1" />
          <div className="flex-4 flex items-center">
            <ul className="flex">
              {navItems.map(item => {
                return (
                  <Link href={item.path} key={item.label}>
                    <li className={`px-2 py-1 cursor-pointer ${hoverTabStyle}`}>
                      {item.label}
                    </li>
                  </Link>
                );
              })}
            </ul>
          </div>
        </header>
      )}
    </>
  );
}
