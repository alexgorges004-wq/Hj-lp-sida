const fs = require("fs");
const path = require("path");

const out = path.join(__dirname, "dist");
fs.rmSync(out, {recursive:true, force:true});
fs.mkdirSync(out, {recursive:true});

for (const file of ["index.html","app.js","config.js","frontpage-admin.js","home-text-blocks.js","recovery.js"]) {
  fs.copyFileSync(path.join(__dirname,file), path.join(out,file));
}

const indexPath = path.join(out, "index.html");
let html = fs.readFileSync(indexPath, "utf8");
if (!html.includes('src="home-text-blocks.js"')) {
  html = html.replace("</body>", '<script src="home-text-blocks.js"></script>\n</body>');
}
if (!html.includes('src="recovery.js"')) {
  html = html.replace("</body>", '<script src="recovery.js"></script>\n</body>');
}
fs.writeFileSync(indexPath, html);

console.log("Built static site to dist/");
