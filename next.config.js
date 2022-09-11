// next.config.js
module.exports = {
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
  },
};
