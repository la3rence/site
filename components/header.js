import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import config from "../lib/config.mjs";
import Logo from "./logo";
import { Adsense } from "./analytics";
import withLocalization from "./withI18n";
import LocalizationSwitch from "./switcher";
import { RSS, GitHubIcon, TwitterIcon } from "./svg";
import Avatar from "./avatar";

const NavComponents = {
  RSS: <RSS />,
  GitHub: <GitHubIcon />,
  Twitter: <TwitterIcon />,
  About: <Avatar />,
};

function Header({
  title,
  description,
  date,
  themeColor,
  birthTime,
  modified,
  tags,
  image,
  blog,
  i18n,
  translations,
}) {
  const router = useRouter();
  let { siteTitle, navItems, authorName, baseURL, siteDescription, twitter, enableAdsense } =
    config;
  const theDescription = description || siteDescription;
  const pageTitle = `${title} - ${siteTitle}`;
  const og = image
    ? `${baseURL}/images/${image}`
    : `${baseURL}/api/og?meta=${title},${themeColor?.replace("#", "")}`;
  const createdDateString = date ? new Date(date).toISOString() : new Date(birthTime);
  const structuredData = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    image: [og],
    datePublished: createdDateString,
    dateModified: modified ? new Date(modified).toISOString() : createdDateString,
    author: [
      {
        "@type": "Person",
        name: authorName,
        url: baseURL,
      },
    ],
  });
  const hoverTabStyle =
    "opacity-65 hover:opacity-95 transition duration-500 hover:transition-transform";

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="keywords" content={`${tags}, ${siteTitle}, ${authorName}, Blog, Article`} />
        <meta name="Description" content={theDescription} />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://giscus.app" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={baseURL} />
        <link rel="preconnect" href="https://raw.githubusercontent.com" crossOrigin="anonymous" />
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
          <meta name="theme-color" content={themeColor} media="(prefers-color-scheme: light)" />
        )}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />
        {config.locales?.map(locale => (
          <link
            key={locale}
            rel="alternate"
            type="application/atom+xml"
            title={`${siteTitle} - ${siteDescription} (${locale})`}
            href={`/${locale}/${config.feedFile}`}
          />
        ))}
        {enableAdsense && <Adsense />}
      </Head>
      <header className="flex justify-between top-0 mt-20 z-50 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-lg">
        <div className="flex justify-between max-w-3xl mx-auto w-full">
          <h1 className="w-48 cursor-pointer">
            <Link href={"/"}>
              <div className={`${hoverTabStyle}`}>
                <Logo title={router.asPath === "/" ? siteTitle : "Blog"} />
              </div>
            </Link>
          </h1>
          <div className="flex-1"></div>
          <nav>
            <ul className="flex">
              {navItems?.map((item, index) => {
                if (item.label === "Locale") {
                  if (config.locales?.length <= 1) return null;
                  return (
                    <li key={`nav-${index}`}>
                      <LocalizationSwitch
                        className={`transition-all ${hoverTabStyle} ${blog && i18n?.length <= 1 ? "pointer-events-none" : ""} `}
                        locales={config.locales}
                        targeturl={router.asPath}
                        currentlocale={router.locale}
                      />
                    </li>
                  );
                }
                const isExternal = /^https?:\/\//.test(item.path);
                return (
                  <li key={`nav-${index}`}>
                    <Link
                      href={item.path}
                      title={item.label}
                      target={isExternal ? "_blank" : undefined}
                      rel={isExternal ? "noopener noreferrer" : undefined}
                      className={`mx-2 ${router.asPath == item.path ? "opacity-90" : hoverTabStyle}`}
                    >
                      {NavComponents[item.label]
                        ? NavComponents[item.label]
                        : translations[item.label]
                          ? translations[item.label]
                          : item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </header>
    </>
  );
}

export default withLocalization(Header);
