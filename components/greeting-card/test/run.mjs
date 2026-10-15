// Runs test/checks.js against the built bundle in jsdom, with the built
// stylesheet's text for the CSS checks.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { JSDOM } from "jsdom";

const require = createRequire(import.meta.url);
const runGreetingCardChecks = require("./checks.js");

const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>", {
  runScripts: "outside-only",
});
dom.window.eval(readFileSync(new URL("../dist/GreetingCard.js", import.meta.url), "utf8"));

const css = readFileSync(new URL("../dist/GreetingCard.css", import.meta.url), "utf8");
const results = runGreetingCardChecks(dom.window, css);
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}`);
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
