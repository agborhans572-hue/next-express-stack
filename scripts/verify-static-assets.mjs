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
  "shiprion/draco/draco_decoder.js",
  "shiprion/draco/draco_wasm_wrapper.js",
  "shiprion/draco/draco_decoder.wasm",
]);
const files = [
  path.join(frontendRoot, "index.html"),
  ...(await sourceFiles(path.join(frontendRoot, "src"))),
];
const replicaManifest = path.join(
  frontendRoot,
  "src/shiprion/content/asset-manifest.json",
);
if (existsSync(replicaManifest)) {
  for (const asset of Object.values(
    JSON.parse(await readFile(replicaManifest, "utf8")),
  )) {
    if (typeof asset === "string" && asset.startsWith("/shiprion/"))
      referenced.add(asset.slice(1));
  }
}
const localAsset =
  /["'`]\/([^"'`?#]+\.(?:webp|png|jpe?g|svg|xml|txt|mp4|glb|otf|woff2?))/gi;

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
