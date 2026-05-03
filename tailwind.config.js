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
    extend: {},
  },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  plugins: [require("@tailwindcss/typography")],
};
