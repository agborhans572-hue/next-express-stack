import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { mkdir, readFile, readdir, writeFile, stat } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const audit = path.join(root, ".cache/cargokite");
const assetsDir = path.join(root, "artifacts/frontend/public/cargokite");
const contentDir = path.join(root, "artifacts/frontend/src/cargokite/content");
await mkdir(assetsDir, { recursive: true });
await mkdir(contentDir, { recursive: true });
const urls = new Set();
for (const filename of await readdir(audit)) {
  if (filename.endsWith(".html")) {
    const markup = await readFile(path.join(audit, filename), "utf8");
    for (const match of markup.matchAll(
      /\b(?:src|poster|data-src|srcset)="([^"]+)"/g,
    )) {
      const value = match[1].split(/\s/)[0].replaceAll("&amp;", "&");
      if (value.startsWith("data:")) continue;
      const parsed = new URL(value, "https://cargokite.com/");
      if (
        [
          "cargokite.com",
          "images.prismic.io",
          "cargokite.cdn.prismic.io",
        ].includes(parsed.hostname)
      )
        urls.add(parsed.href);
    }
  }
  if (!filename.endsWith("-assets.json")) continue;
  const inventory = JSON.parse(
    await readFile(path.join(audit, filename), "utf8"),
  );
  for (const asset of inventory.assets) {
    const parsed = new URL(asset.url);
    if (
      [
        "cargokite.com",
        "images.prismic.io",
        "cargokite.cdn.prismic.io",
      ].includes(parsed.hostname)
    )
      urls.add(asset.url);
  }
}
urls.add("https://cargokite.com/cargo-new-pipe-dense.3754a503.glb");
for (const name of [
  "cargo-hero-deform.2eb55ad8.glb",
  "px.a7dcba4c.png",
  "nx.b560611f.png",
  "py.0cf005c9.png",
  "ny.ce0e11b8.png",
  "pz.c2fa9fc7.png",
  "nz.24df2ce4.png",
])
  urls.add(`https://cargokite.com/${name}`);
const stylesheetUrl = [...urls].find((url) => url.endsWith(".css"));
if (!stylesheetUrl)
  throw new Error("No captured reference stylesheet was found.");
const stylesheetResponse = await fetch(stylesheetUrl);
if (!stylesheetResponse.ok)
  throw new Error(`Stylesheet HTTP ${stylesheetResponse.status}`);
const originalCss = await stylesheetResponse.text();
for (const match of originalCss.matchAll(/url\(([^)]+)\)/g)) {
  const value = match[1].replace(/["']/g, "");
  if (!value.startsWith("data:")) urls.add(new URL(value, stylesheetUrl).href);
}
const manifest = {};
const failures = [];
const queue = [...urls];
await Promise.all(
  Array.from({ length: 5 }, async () => {
    while (queue.length) {
      const url = queue.shift();
      const parsed = new URL(url);
      const basename = decodeURIComponent(
        parsed.pathname.split("/").pop(),
      ).replace(/[^a-zA-Z0-9_.-]/g, "_");
      const name =
        createHash("sha256").update(url).digest("hex").slice(0, 10) +
        "-" +
        basename;
      const destination = path.join(assetsDir, name);
      try {
        if (!(await stat(destination).catch(() => null))?.size) {
          const response = await fetch(url, {
            signal: AbortSignal.timeout(120000),
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          await writeFile(
            destination,
            Buffer.from(await response.arrayBuffer()),
          );
        }
        manifest[url] = `/cargokite/${name}`;
      } catch (error) {
        failures.push({ url, reason: String(error) });
      }
    }
  }),
);
await writeFile(
  path.join(audit, "asset-map.json"),
  JSON.stringify(manifest, null, 2),
);
if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exitCode = 1;
} else {
  let css = await readFile(
    path.join(assetsDir, manifest[stylesheetUrl].split("/").pop()),
    "utf8",
  );
  const require = createRequire(
    path.join(root, "artifacts/frontend/package.json"),
  );
  const postcss = require("postcss");
  const ast = postcss.parse(css);
  const animationNames = new Map();
  ast.walkAtRules((rule) => {
    if (/keyframes$/.test(rule.name)) {
      const original = rule.params;
      rule.params = `ck-${original}`;
      animationNames.set(original, rule.params);
    }
  });
  const fontName = "CargoKiteHelveticaNowDisplay";
  ast.walkDecls((declaration) => {
    if (/^(?:-webkit-)?animation(?:-name)?$/.test(declaration.prop)) {
      for (const [original, scoped] of animationNames)
        declaration.value = declaration.value.replace(
          new RegExp(`\\b${original}\\b`, "g"),
          scoped,
        );
    }
    declaration.value = declaration.value.replace(
      /url\(([^)]+)\)/g,
      (match, raw) => {
        const value = raw.replace(/["']/g, "");
        if (value.startsWith("data:")) return match;
        const resolved = new URL(value, stylesheetUrl).href;
        return manifest[resolved] ? `url("${manifest[resolved]}")` : match;
      },
    );
    if (declaration.prop === "font-family")
      declaration.value = declaration.value.replaceAll(
        "HelveticaNowDisplay",
        fontName,
      );
  });
  ast.walkRules((rule) => {
    if (rule.parent.type === "atrule" && /keyframes$/.test(rule.parent.name))
      return;
    if (rule.selector === ":root") {
      rule.selector = ".cargokite-root";
      return;
    }
    rule.selector = rule.selector
      .split(",")
      .map((selector) => {
        const value = selector.trim();
        if (/^(html|body)(?=[:.\s]|$)/.test(value))
          return value.replace(/^(html|body)/, "$1.cargokite-document");
        return `.cargokite-root ${value}`;
      })
      .join(",");
  });
  await writeFile(
    path.join(contentDir, "reference.css"),
    ast.toString().replace(/\/\*# sourceMappingURL=.*?\*\//g, ""),
  );
  await writeFile(
    path.join(contentDir, "asset-manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
  console.log(
    `Downloaded and verified ${Object.keys(manifest).length} original CargoKite assets.`,
  );
}
