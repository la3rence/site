// next.config.js
module.exports = {
  // experimental: {
  //   appDir: true,
  // },
  i18n: {
    locales: ["zh", "en"],
    defaultLocale: "zh",
  },
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
    domains: ["i.picsum.photos", "picsum.photos", "s3-img.meituan.net"],
    remotePatterns: [
      {
        hostname: "**.doubanio.com",
      },
    ],
  },
};
