// Builds every component and joins their bundles into dist/components.js,
// which starts with a build timestamp.
//
// Usage (from the repo root):
//   npm run build:all              runs each component's npm test, then joins
//   npm run build:all -- --no-test skips the tests (local experiments only)
//
// A component is any folder in components/ with a package.json and a build.mjs
// (e.g. components/greeting-card/). Its bundle is every .js file in its dist/
// folder. Dependencies come from the root install (npm workspaces).
// Components are joined in alphabetical order.
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const componentsDir = join(root, "components");
const runTests = !process.argv.includes("--no-test");
const outFile = join(root, "dist", "components.js");

if (!existsSync(join(root, "node_modules"))) {
  console.error('build-all: no node_modules at the repo root; run "npm install" there first');
  process.exit(1);
}

const components = (existsSync(componentsDir) ? readdirSync(componentsDir) : [])
  .filter((name) => !name.startsWith("."))
  .filter((name) => statSync(join(componentsDir, name)).isDirectory())
  .filter((name) => existsSync(join(componentsDir, name, "package.json")) && existsSync(join(componentsDir, name, "build.mjs")))
  .sort();

if (components.length === 0) {
  console.error("build-all: no components found (folders in components/ with package.json and build.mjs)");
  process.exit(1);
}

const parts = [];
for (const name of components) {
  const dir = join(componentsDir, name);
  console.log(`\n== ${name}: ${runTests ? "npm test" : "npm run build"}`);
  try {
    execSync(runTests ? "npm test" : "npm run build", { cwd: dir, stdio: "inherit" });
  } catch {
    console.error(`build-all: ${name} failed; nothing was written`);
    process.exit(1);
  }
  const distDir = join(dir, "dist");
  const files = existsSync(distDir) ? readdirSync(distDir).filter((f) => f.endsWith(".js")).sort() : [];
  if (files.length === 0) {
    console.error(`build-all: ${name} produced no .js file in dist/`);
    process.exit(1);
  }
  for (const file of files) {
    const code = readFileSync(join(distDir, file), "utf8").replace(/\r\n/g, "\n").trimEnd();
    const nonAscii = code.match(/[^\x00-\x7F]/);
    if (nonAscii) {
      console.error(`build-all: ${name}/dist/${file} has a non-ASCII character (${JSON.stringify(nonAscii[0])}); bundles must be ASCII-only`);
      process.exit(1);
    }
    // A "use strict" directive only works as a file's first statement, so the
    // combined file declares it once at the top and each bundle's copy is dropped.
    parts.push({ label: `components/${name}/dist/${file}`, code: code.replace(/^"use strict";\s*/, "") });
  }
}

const builtAt = new Date().toISOString();
const header = [
  "/*!",
  " * OutSystems front-end components",
  ` * Built: ${builtAt}`,
  " * Contains:",
  ...parts.map((p) => ` *   ${p.label}`),
  " */",
].join("\n");

// Each component bundle is a self-contained IIFE; the separator comment marks
// where each one starts, and the leading ";" guards against a missing one.
const body = parts.map((p) => `// ---- ${p.label} ----\n;${p.code}`).join("\n\n");

mkdirSync(join(root, "dist"), { recursive: true });
writeFileSync(outFile, `${header}\n"use strict";\n\n${body}\n`);
console.log(`\nWrote dist/components.js (${parts.length} bundle${parts.length === 1 ? "" : "s"}, built ${builtAt})`);
