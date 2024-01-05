// eslint-disable-next-line import/no-anonymous-default-export
const config = {
  siteTitle: "Lawrence Li",
  authorName: "Lawrence",
  domain: "lawrenceli.me",
  authorEmail: "hi@lawrenceli.me",
  baseURL: "https://lawrenceli.me",
  feedPath: "/atom.xml",
  feedItemsCount: 10,
  siteDescription: "Blog",
  activityPubUser: "lawrence",
  twitter: "la3rence",
  github: "la3rence",
  repo: "site",
  enableAnalytics: true,
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
    {
      label: "Blog",
      path: "/",
    },
    {
      label: "About",
      path: "/about",
    },
    {
      label: "RSS",
      path: "/atom.xml",
    },
  ],
  mailchimp: "https://subscribe.lawrenceli.me/",
  projects: [
    {
      name: "Ops Bot",
      desc: "A robot hosted on serverless platform for GitHub issue/pull-request automation",
      url: "https://github.com/la3rence/opsbot",
    },
    {
      name: "EUDIC SDK for GoLang",
      desc: "A Golang SDK for reciting words from EUDIC wordbook",
      url: "https://pkg.go.dev/github.com/la3rence/go-eudic",
    },
    {
      name: "WebSocket Cluster with Spring Cloud",
      desc: "Scalable distributed WebSocket service implemented with consistent hash algorithm",
      url: "/blog/websocket-cluster",
    },
    {
      name: "Solidot Robot",
      desc: "A serverless robot posts the news from solidot.org to fanfou.com with data stored via MongoDB",
      url: "/blog/solidot-robot",
    },
    {
      name: "Send message to Lawrence",
      desc: "A single page app to send text to me via websocket (in realtime) - I will receive it on my Phone but may not be able to reply immediately",
      url: "https://chatroom.lawrenceli.me",
    },
    {
      name: "ChatGPT Web UI",
      desc: "[WIP] Next.js application with server-sent events and OpenAI GPT API",
      url: "https://github.com/la3rence/gpt-next",
    },
  ],
};

export default config;
