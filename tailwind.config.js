/** @type {import('tailwindcss').Config} */

module.exports = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.js",
    "./posts/**/*.md",
  ],
  safelist: ["text-[#f88100]"],
  theme: {
    // screens: {
    //   '2xl': { 'max': '1535px' },
    //   'xl': { 'max': '1279px' },
    //   'lg': { 'max': '1023px' },
    //   'md': { 'max': '767px' },
    //   'sm': { 'max': '639px' },
    // },
    extend: {
      typography: () => ({
        DEFAULT: {
          css: {
            "p>a:not(.data-footnote-backref), .blog li>a": {
              "border-bottom-width": "1px",
              "text-decoration": "none",
              "border-color": "#bbb",
              "word-break": "break-word",
              transition: "border-color 0.25s cubic-bezier(.4,0,.2,1)",
              "&:hover": {
                "border-color": "#000",
              },
              "@media (prefers-color-scheme: dark)": {
                "border-color": "#999",
                "&:hover": {
                  "border-color": "#fff",
                },
              },
            },
            "h1, h2, h3, h4, h5, h6": {
              "margin-top": "1em",
            },
            "h2 a, h3 a, h4 a, h5 a, h6 a, .data-footnote-backref": {
              "text-decoration": "none",
            },
            ".toc-link": {
              color: "#777",
              "&:hover": {
                color: "#000",
              },
              "@media (prefers-color-scheme: dark)": {
                color: "#bbb",
                "&:hover": {
                  color: "#fff",
                },
              },
            },
            ".toc-item": {
              "list-style-type": "none",
            },
          },
        },
      }),
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
