// next.config.js
module.exports = {
  // experimental: {
  //   appDir: true,
  // },
  // i18n: {
  //   locales: ["zh"],
  //   defaultLocale: "zh",
  // },
  transpilePackages: ["react-tweet"],
  async rewrites() {
    return [
      {
        source: "/.well-known/:param",
        destination: "/api/.well-known/:param",
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
