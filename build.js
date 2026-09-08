const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const out = path.join(__dirname, "dist");
const staticFiles = [
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
  "v2-height-fix.js",
  "v2-invite.js",
  "v2-admin-hardening.js",
  "step-order-fix.js",
  "multi-image-fix.js",
  "multi-image-late-loader.js",
  "media-editor-click-fix.js",
  "multi-select-image-fix.js",
  "guide-text-size.js",
  "favicon.ico"
];

const syntaxFiles = [
  ...staticFiles.filter((file) => file.endsWith(".js")),
  "netlify/functions/admin-users.mjs",
  "api/admin-users.mjs"
];

for (const file of syntaxFiles) {
  execFileSync(process.execPath, ["--check", path.join(__dirname, file)], { stdio: "inherit" });
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

for (const file of staticFiles) {
  fs.copyFileSync(path.join(__dirname, file), path.join(out, file));
}

console.log("Syntax check passed. Built static site to dist/");
