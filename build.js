const fs = require("fs");
const path = require("path");

const out = path.join(__dirname, "dist");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

for (const file of [
  "index.html",
  "app.js",
  "config.js",
  "frontpage-core.js",
  "home-text-blocks.js",
  "recovery.js",
  "polish.js",
  "v2.js",
  "v2-core.js",
  "v2-layout.js",
  "v2-tools.js",
  "favicon.ico"
]) {
  fs.copyFileSync(path.join(__dirname, file), path.join(out, file));
}

console.log("Built static site to dist/");
