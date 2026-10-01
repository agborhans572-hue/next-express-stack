import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const frontendRoot = path.join(workspaceRoot, "artifacts", "frontend");
const publicRoot = path.join(frontendRoot, "public");

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await sourceFiles(absolute)));
    else if (/\.(?:ts|tsx|css|html)$/.test(entry.name)) files.push(absolute);
  }
  return files;
}

const referenced = new Set([
  "favicon.svg",
  "opengraph.jpg",
  "robots.txt",
  "sitemap.xml",
]);
const files = [
  path.join(frontendRoot, "index.html"),
  ...(await sourceFiles(path.join(frontendRoot, "src"))),
];
const localAsset = /["'`]\/([^"'`?#]+\.(?:webp|png|jpe?g|svg|xml|txt))/gi;

for (const file of files) {
  const contents = await readFile(file, "utf8");
  for (const match of contents.matchAll(localAsset)) referenced.add(match[1]);
}

const missing = [...referenced]
  .filter((asset) => !existsSync(path.join(publicRoot, asset)))
  .sort();

if (missing.length) {
  console.error(
    `Missing frontend public assets:\n${missing.map((asset) => `- /${asset}`).join("\n")}`,
  );
  process.exit(1);
}

console.log(`Verified ${referenced.size} frontend public assets.`);
