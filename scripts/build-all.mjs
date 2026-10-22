// Builds the release: two files, each starting with the same version and build
// timestamp:
//   dist/components.js    one bundle of every component (one Script)
//   dist/components.css   every component's stylesheet (one stylesheet)
//
// The JS is bundled from a single entry that imports every component's
// src/index.ts and registers each class on window.<namespace> (the namespace
// from factory.config.json), so code the components share is included once.
// It also sets window.<namespace>.__release to the version, so the browser
// console says which release a page runs. The CSS is each component's built
// stylesheet, joined with a marker per component.
//
// Version: <ISO year>.<ISO week>.<N>, from the build's UTC date, no padding
// (e.g. 2026.42.1). N counts committed releases within that ISO week: it is the
// N of the last committed dist/components.js plus 1 when that one is from the
// same week, otherwise 1. Test builds don't use up numbers; every build shows
// the next release number until one is committed.
//
// Size budgets ("budgets" in factory.config.json): the build fails when a file
// is larger, so growth is a decision, not an accident.
//
// Usage (from the repo root):
//   npm run build:all              lint, test every component, then build
//   npm run build:all -- --no-test skips the lint and tests (local experiments only)
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { bundle, registrationEntry } from '../packages/toolchain/lib.mjs';
import { loadConfig } from './lib/config.mjs';
import { componentsDir, listComponents, loadContract } from './lib/contract.mjs';

const root = join(import.meta.dirname, '..');
const runTests = !process.argv.includes('--no-test');

function fail(message) {
	console.error(`build-all: ${message}; nothing was written`);
	process.exit(1);
}

if (!existsSync(join(root, 'node_modules'))) fail('no node_modules at the repo root; run "npm install" there first');
const config = loadConfig();
const components = listComponents(componentsDir).map((folder) => {
	const { contract, errors } = loadContract(folder);
	if (!contract || errors.length) fail(`components/${folder}/component.json: ${errors.join('; ')}`);
	return contract;
});
if (components.length === 0) fail('nothing to release: components/ has no component yet. Create one from the template (docs/guide/NewComponent.md); templates/ never ships');

// ESLint, the link check, stylelint and Prettier over the whole repo first.
if (runTests) {
	console.log('\n== lint: npm run lint');
	try {
		execSync('npm run lint', { cwd: root, stdio: 'inherit' });
	} catch {
		fail('lint failed');
	}
}

// Each component: its tests (typecheck, build, every check), or just its build.
for (const c of components) {
	console.log(`\n== ${c.folder}: ${runTests ? 'npm test' : 'npm run build'}`);
	try {
		execSync(runTests ? 'npm test' : 'npm run build', { cwd: join(componentsDir, c.folder), stdio: 'inherit' });
	} catch {
		fail(`${c.folder} failed`);
	}
}

// Every component.json agrees with its code, after the builds.
if (runTests) {
	console.log('\n== contracts: node scripts/check-contracts.mjs');
	try {
		execSync('node scripts/check-contracts.mjs', { cwd: root, stdio: 'inherit' });
	} catch {
		fail('a contract disagrees with its code');
	}
}

const now = new Date();
const builtAt = now.toISOString();

// ISO 8601 week of a date, in UTC: weeks start on Monday, and the week's
// Thursday decides which year it belongs to (so 31 Dec 2029 is 2030 week 1).
function isoWeek(date) {
	const t = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
	const day = t.getUTCDay() || 7; // Monday 1 ... Sunday 7
	t.setUTCDate(t.getUTCDate() + 4 - day);
	const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
	return { year: t.getUTCFullYear(), week: Math.ceil(((t - yearStart) / 86400000 + 1) / 7) };
}

// The version of the last committed release, read from git (empty if there is
// none, or no git).
function lastCommittedVersion() {
	try {
		const committed = execSync('git show HEAD:dist/components.js', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
		const m = committed.match(/^ \* Version: (\d+)\.(\d+)\.(\d+)$/m);
		return m ? { year: Number(m[1]), week: Number(m[2]), n: Number(m[3]) } : null;
	} catch {
		return null;
	}
}

const { year, week } = isoWeek(now);
const previous = lastCommittedVersion();
const n = previous && previous.year === year && previous.week === week ? previous.n + 1 : 1;
const version = `${year}.${week}.${n}`;

// The JS: one bundle from one entry.
const entry = registrationEntry(
	config.namespace,
	components.map((c) => ({ className: c.class, importPath: `./components/${c.folder}/src/index.ts` })),
	version,
);
const js = (await bundle(entry, root, { strict: false })).replace(/\r\n/g, '\n').trimEnd();
// eslint-disable-next-line no-control-regex -- matching the whole ASCII range is intended
const ascii = (text, file) => text.match(/[^\x00-\x7F]/) && fail(`${file} has a non-ASCII character; output must be ASCII-only`);
ascii(js, 'dist/components.js');

// The CSS: each component's built stylesheet, with a marker per component.
const styles = components.map((c) => {
	const file = `components/${c.folder}/dist/${c.class}.css`;
	if (!existsSync(join(root, file))) fail(`${file} is missing`);
	const text = readFileSync(join(root, file), 'utf8').replace(/\r\n/g, '\n').trimEnd();
	ascii(text, file);
	return { label: file, text };
});
const css = styles.map((p) => `/* ---- ${p.label} ---- */\n${p.text}`).join('\n\n');

const header = (title, labels) => ['/*!', ` * Version: ${version}`, ` * ${title}`, ` * Built: ${builtAt}`, ' * Contains:', ...labels.map((l) => ` *   ${l}`), ' */'].join('\n');
const jsOut = `${header(
	`${config.project} components`,
	components.map((c) => `components/${c.folder}/src/index.ts`),
)}\n"use strict";\n\n${js}\n`;
const cssOut = `${header(
	`${config.project} components: styles`,
	styles.map((s) => s.label),
)}\n\n${css}\n`;

// Smoke test of the two files, before anything is written:
// - components.js runs in a page, registers every class and the release version
// - components.css has rules for every component, and no rule outside a
//   component's BEM block (or an OutSystems UI context class in front of one)
// - both are within their size budgets
const { JSDOM } = await import('jsdom');
const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', { runScripts: 'outside-only' });
try {
	dom.window.eval(jsOut);
} catch (e) {
	fail(`dist/components.js throws when loaded: ${e.message}`);
}
const ns = dom.window[config.namespace] || {};
for (const c of components) if (typeof ns[c.class] !== 'function') fail(`dist/components.js doesn't register window.${config.namespace}.${c.class}`);
if (ns.__release !== version) fail(`dist/components.js sets window.${config.namespace}.__release to ${ns.__release}, not ${version}`);
const blocks = components.map((c) => c.block);
const blocksUsed = new Set();
for (const rule of cssOut.replace(/\/\*[\s\S]*?\*\//g, '').match(/[^{}]+(?=\{[^{}]*\})/g) || []) {
	for (const sel of rule
		.split(',')
		.map((x) => x.trim())
		.filter((x) => x && !x.startsWith('@'))) {
		const found = [...sel.matchAll(/\.([a-z0-9]+(?:-[a-z0-9]+)*)(?:__|--|(?![\w-]))/g)].map((m) => m[1]).filter((b) => blocks.includes(b));
		if (found.length === 0) fail(`dist/components.css has a rule outside every component block: "${sel}"`);
		found.forEach((b) => blocksUsed.add(b));
	}
}
const unstyled = components.filter((c) => !blocksUsed.has(c.block)).map((c) => c.folder);
if (unstyled.length) fail(`dist/components.css has no rules for: ${unstyled.join(', ')}`);
const kb = (text) => Buffer.byteLength(text) / 1024;
const budgets = config.budgets || {};
for (const [file, text, budget] of [
	['dist/components.js', jsOut, budgets.releaseJsKB],
	['dist/components.css', cssOut, budgets.releaseCssKB],
]) {
	if (budget && kb(text) > budget) fail(`${file} is ${kb(text).toFixed(1)} KB, over its ${budget} KB budget (factory.config.json "budgets"); shrink it, or raise the budget deliberately`);
}
const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;
console.log(`\nSmoke test: components.js loads and registers ${plural(components.length, 'class')} and __release ${version}; components.css styles ${plural(components.length, 'component')}`);

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist', 'components.js'), jsOut);
writeFileSync(join(root, 'dist', 'components.css'), cssOut);
const sizes = `${kb(jsOut).toFixed(1)} KB${budgets.releaseJsKB ? ` of ${budgets.releaseJsKB}` : ''} JS, ${kb(cssOut).toFixed(1)} KB${budgets.releaseCssKB ? ` of ${budgets.releaseCssKB}` : ''} CSS`;
console.log(`\nWrote dist/components.js and dist/components.css (${plural(components.length, 'component')}, ${sizes}): version ${version}, built ${builtAt}`);
