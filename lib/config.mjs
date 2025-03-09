import nextConfig from "../next.config.js";

const config = {
  siteTitle: "Lawrence Li",
  authorName: "Lawrence",
  domain: "lawrenceli.me",
  authorEmail: "hi@lawrenceli.me",
  baseURL: "https://lawrenceli.me",
  oidcIssuer: "https://login.lawrenceli.me",
  defaultLocale: nextConfig.i18n?.defaultLocale,
  locales: nextConfig.i18n?.locales,
  feedFile: "atom.xml",
  feedItemsCount: 10,
  siteDescription: "Blog",
  activityPubUser: "lawrence",
  twitter: "la3rence",
  github: "la3rence",
  repo: "site",
  enableAnalytics: process.env.NEXT_PUBLIC_ANALYTICS_ENABLE === "true",
  enableAdsense: false,
  enableBuildInfo: false,
  enableToC: false,
  enableDisqus: false,
  disqusName: "lawrenceli",
  enableGitHubComment: true,
  commentRepo: "comments",
  commentRepoId: "R_kgDOK6-cpA",
  commentCategoryId: "DIC_kwDOK6-cpM4Cb1CQ",
  websubHub: "https://pubsubhubbub.appspot.com/",
  navItems: [
    // {
    //   label: "Blog",
    //   path: "/",
    // },
    {
      label: "Moments",
      path: "/moments",
    },
    // {
    //   label: "Things",
    //   path: "/things",
    // },
    {
      label: "About",
      path: "/about",
    },
    {
      label: "RSS",
      path: "/atom.xml",
    },
  ],
  projects: [
    {
      name: "● Ops Bot",
      desc: "A robot hosted on serverless platform for GitHub issue or pull-request automation",
      desc_zh: "一个托管于 Serverless 平台的机器人，自动接管 GitHub 上的 Issue 或 PR",
      url: "https://github.com/la3rence/opsbot",
    },
    {
      name: "■ EUDIC SDK for GoLang",
      desc: "A Golang SDK for reciting words from EUDIC wordbook",
      desc_zh: "欧陆词典中背单词的 GoLang SDK",
      url: "https://pkg.go.dev/github.com/la3rence/go-eudic",
    },
    {
      name: "● WebSocket Cluster with Spring Cloud",
      desc: "Scalable distributed WebSocket service implemented with consistent hash algorithm",
      desc_zh: "基于一致性哈希算法实现的可扩展的分布式 WebSocket 服务",
      url: "/blog/websocket-cluster",
    },
    {
      name: "▲ Solidot Robot",
      desc: "A serverless robot posts the news from solidot.org to fanfou.com with data stored via MongoDB",
      desc_zh: "将 solidot 上的新闻发布到饭否的机器人",
      url: "/blog/solidot-robot",
    },
    {
      name: "■ Send message to Lawrence",
      desc: "A single page app to send text to me via websocket (in realtime) - I will receive it on my Phone but may not be able to reply immediately",
      desc_zh: "一个基于 WebSocket 实现的 SPA 聊天站点",
      url: "https://chatroom.lawrenceli.me",
    },
    {
      name: "● ChatGPT Web UI",
      desc: "[WIP] Next.js application with server-sent events and OpenAI GPT API",
      desc_zh: "基于 SSE 和 OpenAI API 与 Next.js 实现的 GPT 会话页面",
      url: "https://github.com/la3rence/gpt-next",
    },
  ],
};

export default config;
