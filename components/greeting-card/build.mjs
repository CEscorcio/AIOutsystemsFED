// Builds the two files that go to OutSystems:
//   dist/GreetingCard.js   src/ bundled into one Script (IIFE + ES2019 + not
//                          minified, so the published copy can be diffed)
//   dist/GreetingCard.css  every .css file in style/, joined in alphabetical
//                          order, shipped as a stylesheet of its own
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { build } from "esbuild";

await build({
  entryPoints: ["src/index.ts"],
  outfile: "dist/GreetingCard.js",
  bundle: true,
  format: "iife",
  target: "es2019",
  minify: false,
  charset: "utf8",
  legalComments: "none",
  logLevel: "info",
});

const cssFiles = readdirSync("style").filter((f) => f.endsWith(".css")).sort();
if (cssFiles.length === 0) throw new Error("build: style/ has no .css file");
const css = cssFiles
  .map((f) => readFileSync(`style/${f}`, "utf8").replace(/\r\n/g, "\n").trim())
  .join("\n\n");
writeFileSync("dist/GreetingCard.css", `${css}\n`);
console.log(`\n  dist/GreetingCard.css  from style/${cssFiles.join(", style/")}`);
