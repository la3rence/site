// next.config.js

module.exports = {
  // experimental: {
  //   appDir: true,
  // },
  i18n: {
    locales: ["zh", "en", "ja"], // post.en.md, post.ja.md
    defaultLocale: "zh", // post.zh.md or post.md
    localeDetection: false,
  },
  transpilePackages: ["react-tweet"],
  async headers() {
    return [
      {
        source: "/ads.txt",
        headers: [
          {
            key: "Content-Type",
            value: "text/plain",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/.well-known/:param",
        destination: "/api/.well-known/:param",
      },
      {
        source: "/:locale/atom.xml",
        destination: "/atom.:locale.xml",
        locale: false,
      },
      // {
      //   source: "/blog/:path",
      //   has: [
      //     {
      //       type: "header",
      //       key: "accept",
      //       value: "(.*activity.*)",
      //     },
      //   ],
      //   destination: "/api/activitypub/blog/:path",
      // },
    ];
  },
  async redirects() {
    return [
      {
        source: "/blog",
        destination: "/",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        hostname: "**.doubanio.com",
      },
      {
        hostname: "**.githubusercontent.com",
      },
      {
        hostname: "**.lawrenceli.me",
      },
      {
        hostname: "**.twimg.com",
      },
    ],
  },
};
