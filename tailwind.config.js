/** @type {import('tailwindcss').Config} */

module.exports = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.js",
    "./posts/**/*.md",
  ],
  theme: {
    // screens: {
    //   '2xl': { 'max': '1535px' },
    //   'xl': { 'max': '1279px' },
    //   'lg': { 'max': '1023px' },
    //   'md': { 'max': '767px' },
    //   'sm': { 'max': '639px' },
    // },
    extend: {
      typography: {
        DEFAULT: {
          css: {
            "p>a, .blog li>a": {
              color: "#1d9bf0",
              "&:hover": {
                "text-decoration": "underline",
              },
              "text-decoration": "none",
              "word-break": "break-word",
            },
            "h2 a, h3 a, h4 a, h5 a, h6 a": {
              "text-decoration": "none",
            },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
