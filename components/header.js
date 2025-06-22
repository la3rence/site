import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import config from "../lib/config.mjs";
import Logo from "./logo";
import { Adsense } from "./analytics";
import withLocalization from "./withI18n";
import LocalizationSwitch from "./switcher";
import { useEffect, useState } from "react";

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

  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [lastScrollTop, setLastScrollTop] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      if (scrollTop > lastScrollTop) {
        setIsNavbarVisible(false);
      } else {
        setIsNavbarVisible(true);
      }
      setLastScrollTop(scrollTop <= 0 ? 0 : scrollTop);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollTop]);

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="keywords" content={`${tags}, ${siteTitle}, ${authorName}, Blog, Article`} />
        <meta name="Description" content={theDescription} />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
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
      <header
        className={`${isNavbarVisible ? "translate-y-0" : "-translate-y-full"} sticky-header`}
      >
        <div className="flex justify-between max-w-3xl mx-auto w-full">
          <h1 className="w-48 cursor-pointer">
            <Link href={"/"}>
              <div className={`py-1 ${hoverTabStyle}`}>
                <Logo title={"B!og"} />
              </div>
            </Link>
          </h1>
          <div className="flex-1"></div>
          <nav className="mt-2">
            <ul className="flex">
              {navItems?.map(item => {
                return (
                  <li key={item.label}>
                    <Link
                      href={item.path}
                      className={`mx-2 ${router.asPath == item.path ? "opacity-90" : hoverTabStyle}`}
                    >
                      {translations[item.label] ? translations[item.label] : item.label}
                    </Link>
                  </li>
                );
              })}
              {config.locales?.length > 1 && (
                <LocalizationSwitch
                  className={`${blog && i18n?.length <= 1 ? "pointer-events-none" : ""} px-2 py-1 hover:scale-110 transition-all ${hoverTabStyle}`}
                  locales={config.locales}
                  targeturl={router.asPath}
                  currentlocale={router.locale}
                />
              )}
            </ul>
          </nav>
        </div>
      </header>
    </>
  );
}

export default withLocalization(Header);
