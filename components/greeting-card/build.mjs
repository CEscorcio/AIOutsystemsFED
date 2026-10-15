// Bundles src/ into the single file that goes to OutSystems as a Script.
// IIFE + ES2019 + not minified, so the published copy can be diffed against disk.
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
