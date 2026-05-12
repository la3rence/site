const path = require("path");

const buildOxlintCommand = filenames => {
  const files = filenames.map(f => `"${path.relative(process.cwd(), f)}"`).join(" ");
  return `oxlint --fix ${files}`;
};

module.exports = {
  "*.{js,jsx,ts,tsx}": [buildOxlintCommand],
};
