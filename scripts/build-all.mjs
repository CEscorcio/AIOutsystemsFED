// Builds every component and joins their output into two files, each of which
// starts with the same version and build timestamp:
//   dist/components.js    every component's JS bundle (one Script)
//   dist/components.css   every component's stylesheet (one stylesheet)
//
// Version: <ISO year>.<ISO week>.<N>, from the build's UTC date, no padding
// (e.g. 2026.42.1). N counts committed releases within that ISO week: it is the
// N of the last committed dist/components.js plus 1 when that one is from the
// same week, otherwise 1. Test builds don't use up numbers; every build shows
// the next release number until one is committed.
//
// Usage (from the repo root):
//   npm run build:all              runs each component's npm test, then joins
//   npm run build:all -- --no-test skips the tests (local experiments only)
//
// A component is any folder in components/ with a package.json and a build.mjs
// (e.g. components/greeting-card/). Its output is every .js and .css file in its
// dist/ folder. Dependencies come from the root install (npm workspaces).
// Components are joined in alphabetical order.
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const componentsDir = join(root, 'components');
const runTests = !process.argv.includes('--no-test');

if (!existsSync(join(root, 'node_modules'))) {
	console.error('build-all: no node_modules at the repo root; run "npm install" there first');
	process.exit(1);
}

const components = (existsSync(componentsDir) ? readdirSync(componentsDir) : [])
	.filter((name) => !name.startsWith('.'))
	.filter((name) => statSync(join(componentsDir, name)).isDirectory())
	.filter((name) => existsSync(join(componentsDir, name, 'package.json')) && existsSync(join(componentsDir, name, 'build.mjs')))
	.sort();

if (components.length === 0) {
	console.error('build-all: no components found (folders in components/ with package.json and build.mjs)');
	process.exit(1);
}

function fail(message) {
	console.error(`build-all: ${message}; nothing was written`);
	process.exit(1);
}

// Reads every dist/*.<ext> file of a component, LF line endings, ASCII-only.
function readOutputs(name, ext) {
	const distDir = join(componentsDir, name, 'dist');
	const files = existsSync(distDir)
		? readdirSync(distDir)
				.filter((f) => f.endsWith(ext))
				.sort()
		: [];
	if (files.length === 0) fail(`${name} produced no ${ext} file in dist/`);
	return files.map((file) => {
		const text = readFileSync(join(distDir, file), 'utf8').replace(/\r\n/g, '\n').trimEnd();
		// eslint-disable-next-line no-control-regex -- matching the whole ASCII range is intended
		const nonAscii = text.match(/[^\x00-\x7F]/);
		if (nonAscii) fail(`${name}/dist/${file} has a non-ASCII character (${JSON.stringify(nonAscii[0])}); output must be ASCII-only`);
		return { label: `components/${name}/dist/${file}`, text };
	});
}

// ESLint, stylelint and Prettier over the whole repo first, unless the tests are skipped.
if (runTests) {
	console.log('\n== lint: npm run lint');
	try {
		execSync('npm run lint', { cwd: root, stdio: 'inherit' });
	} catch {
		fail('lint failed');
	}
}

const scripts = [];
const styles = [];
for (const name of components) {
	console.log(`\n== ${name}: ${runTests ? 'npm test' : 'npm run build'}`);
	try {
		execSync(runTests ? 'npm test' : 'npm run build', { cwd: join(componentsDir, name), stdio: 'inherit' });
	} catch {
		fail(`${name} failed`);
	}
	// A "use strict" directive only works as a file's first statement, so the
	// combined JS declares it once at the top and each bundle's copy is dropped.
	for (const s of readOutputs(name, '.js')) scripts.push({ ...s, text: s.text.replace(/^"use strict";\s*/, '') });
	styles.push(...readOutputs(name, '.css'));
}

// Every component.json agrees with its code (scripts/check-contracts.mjs), after the builds.
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
		const committed = execSync('git show HEAD:dist/components.js', {
			cwd: root,
			stdio: ['ignore', 'pipe', 'ignore'],
		}).toString();
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

const header = (title, parts) => ['/*!', ` * Version: ${version}`, ` * ${title}`, ` * Built: ${builtAt}`, ' * Contains:', ...parts.map((p) => ` *   ${p.label}`), ' */'].join('\n');

// Each JS bundle is a self-contained IIFE; the separator comment marks where
// each one starts, and the leading ";" guards against a missing one.
const js = scripts.map((p) => `// ---- ${p.label} ----\n;${p.text}`).join('\n\n');
const css = styles.map((p) => `/* ---- ${p.label} ---- */\n${p.text}`).join('\n\n');

const jsOut = `${header('AIOutsystemsFED components', scripts)}\n"use strict";\n\n${js}\n`;
const cssOut = `${header('AIOutsystemsFED components: styles', styles)}\n\n${css}\n`;

// Smoke test of the two combined files, before anything is written:
// - components.js runs in a page and registers every component's class
// - components.css has rules for every component, and no rule outside a
//   component's BEM block (or an OutSystems UI context class in front of one)
const { JSDOM } = await import('jsdom');
const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', { runScripts: 'outside-only' });
try {
	dom.window.eval(jsOut);
} catch (e) {
	fail(`dist/components.js throws when loaded: ${e.message}`);
}
for (const s of scripts) {
	const reg = s.text.match(/\bw\.([A-Za-z_$][\w$]*)\.([A-Za-z_$][\w$]*)\s*=/);
	if (!reg) fail(`${s.label} doesn't register itself as window.<Namespace>.<Class>`);
	if (typeof (dom.window[reg[1]] || {})[reg[2]] !== 'function') fail(`${s.label} didn't register window.${reg[1]}.${reg[2]} in the combined file`);
}
const cssRules = cssOut.replace(/\/\*[\s\S]*?\*\//g, '').match(/[^{}]+(?=\{[^{}]*\})/g) || [];
const blocksUsed = new Set();
for (const rule of cssRules) {
	for (const sel of rule
		.split(',')
		.map((x) => x.trim())
		.filter((x) => x && !x.startsWith('@'))) {
		const blocks = [...sel.matchAll(/\.([a-z0-9]+(?:-[a-z0-9]+)*)(?:__|--|(?![\w-]))/g)].map((m) => m[1]).filter((b) => components.includes(b));
		if (blocks.length === 0) fail(`dist/components.css has a rule outside every component block: "${sel}"`);
		blocks.forEach((b) => blocksUsed.add(b));
	}
}
const unstyled = components.filter((name) => !blocksUsed.has(name));
if (unstyled.length) fail(`dist/components.css has no rules for: ${unstyled.join(', ')}`);
console.log(
	`\nSmoke test: components.js loads and registers ${scripts.length} class${scripts.length === 1 ? '' : 'es'}; components.css styles ${components.length} component${components.length === 1 ? '' : 's'}`,
);

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist', 'components.js'), jsOut);
writeFileSync(join(root, 'dist', 'components.css'), cssOut);
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
console.log(`\nWrote dist/components.js (${plural(scripts.length, 'bundle')}) and dist/components.css (${plural(styles.length, 'stylesheet')}): version ${version}, built ${builtAt}`);
