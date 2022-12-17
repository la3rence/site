/** @type {import('tailwindcss').Config} */

module.exports = {
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
              color: "#3182ce",
              "&:hover": {
                "text-decoration": "underline",
                color: "#2c5282",
              },
              "text-decoration": "none",
              "word-break": "break-word",
            },
            "h1 a, h2 a, h3 a, h4 a, h5 a, h6 a": {
              "text-decoration": "none",
              "&:hover": {
                "text-decoration": "underline",
              },
            },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
