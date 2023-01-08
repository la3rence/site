// eslint-disable-next-line import/no-anonymous-default-export
export default {
  siteTitle: "Lawrence Li",
  authorName: "Lawrence",
  authorEmail: "hi@lawrenceli.me",
  baseURL: "https://lawrenceli.me",
  feedPath: "/atom.xml",
  siteDescription: "Blog",
  twitter: "@lawrenceli75",
  github: "Lonor",
  enableLike: true,
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
      url: "https://github.com/Lonor/opsbot",
    },
    {
      name: "EUDIC SDK for GoLang",
      desc: "A Golang SDK for reciting words from EUDIC wordbook",
      url: "https://pkg.go.dev/github.com/Lonor/go-eudic",
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
      url: "https://chat.lawrenceli.me",
    },
  ],
};
