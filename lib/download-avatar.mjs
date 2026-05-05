import { writeFileSync, existsSync } from "node:fs";
import config from "./config.mjs";

const avatarUrl = `https://github.com/${config.github}.png`;
const outputPath = new URL("../public/images/avatar.png", import.meta.url);

if (existsSync(outputPath)) {
  console.log("Avatar already exists, skipping download");
  process.exit(0);
}

try {
  const response = await fetch(avatarUrl);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(outputPath, buffer);
  console.log("Avatar downloaded to", outputPath.pathname);
} catch (error) {
  console.error("Failed to download avatar:", error.message);
  process.exit(1);
}
