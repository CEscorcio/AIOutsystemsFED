// Copies the example pattern into a new folder and renames it consistently.
//
// Usage: node scaffold.mjs <PatternName> <Namespace> [--from <example-dir>] [--to <target-dir>]
//   PatternName  PascalCase class name, e.g. StatusBadge
//   Namespace    global namespace the bundle registers on window, e.g. MyCompany
//   --from       example to copy (default: <repo>/components/greeting-card)
//   --to         new folder (default: <repo>/components/<pattern-name>)
//
// Renames, in file contents and paths:
//   GreetingCard   -> <PatternName>   (class, types, file names, runXChecks)
//   greeting-card  -> <pattern-name>  (BEM block, style/ file, folder, package name)
//   ClaudeTest     -> <Namespace>     (window.<Namespace>.<PatternName>)
//   gc-test-mount  -> <pattern-name>-test-mount
// Skips node_modules and dist (dist is rebuilt by npm test).
import { cpSync, existsSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OSUI_CLASS_NAMES = new Set([
	'card',
	'btn',
	'tabs',
	'popup',
	'list',
	'table',
	'form',
	'badge',
	'tag',
	'alert',
	'feedback-message',
	'accordion',
	'sidebar',
	'carousel',
	'gallery',
	'columns',
	'layout',
	'header',
	'menu',
	'wizard',
	'tooltip',
	'dropdown',
	'notification',
	'progress-bar',
	'progress-circle',
	'rating',
	'search',
	'section',
	'separator',
	'stacked-cards',
	'timeline',
	'user-avatar',
	'breadcrumbs',
	'pagination',
]);

function fail(message) {
	console.error(`scaffold: ${message}`);
	process.exit(1);
}

const args = process.argv.slice(2);
const positional = args.filter((a, i) => !a.startsWith('--') && !(args[i - 1] || '').startsWith('--'));
const option = (name) => {
	const i = args.indexOf(`--${name}`);
	return i === -1 ? undefined : args[i + 1];
};

const [pascal, namespace] = positional;
if (!pascal || !namespace) fail('usage: node scaffold.mjs <PatternName> <Namespace> [--from dir] [--to dir]');
if (!/^[A-Z][A-Za-z0-9]+$/.test(pascal)) fail(`PatternName must be PascalCase letters and digits: ${pascal}`);
if (!/^[A-Z][A-Za-z0-9]*$/.test(namespace)) fail(`Namespace must start with a capital letter: ${namespace}`);
if (pascal === 'GreetingCard') fail("pick a name other than the example's");

const kebab = pascal
	.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
	.replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
	.toLowerCase();
if (OSUI_CLASS_NAMES.has(kebab)) fail(`"${kebab}" is an OutSystems UI class; the BEM block must not collide with it (Style.md, Rule 0)`);

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const from = resolve(option('from') || join(repo, 'components', 'greeting-card'));
const to = resolve(option('to') || join(repo, 'components', kebab));
if (!existsSync(join(from, 'package.json'))) fail(`no example at ${from}`);
if (existsSync(to)) fail(`${to} already exists`);

cpSync(from, to, {
	recursive: true,
	filter: (src) => !/[\\/](node_modules|dist)([\\/]|$)/.test(src.slice(from.length)),
});

const replacements = [
	['GreetingCard', pascal],
	['greeting-card', kebab],
	['ClaudeTest', namespace],
	['gc-test-mount', `${kebab}-test-mount`],
];
const rewrite = (text) => replacements.reduce((t, [a, b]) => t.split(a).join(b), text);

const changed = [];
function walk(dir) {
	for (const entry of readdirSync(dir)) {
		const path = join(dir, entry);
		if (statSync(path).isDirectory()) {
			walk(path);
		} else {
			const before = readFileSync(path, 'utf8');
			const after = rewrite(before);
			if (after !== before) {
				writeFileSync(path, after);
				changed.push(path.slice(to.length + 1));
			}
		}
		const renamed = rewrite(entry);
		if (renamed !== entry) {
			renameSync(path, join(dir, renamed));
		}
	}
}
walk(to);

console.log(`Created ${to}`);
console.log(`  class      ${pascal}`);
console.log(`  BEM block  ${kebab}`);
console.log(`  global     window.${namespace}.${pascal}`);
console.log(`  bundle     dist/${pascal}.js`);
console.log(`Rewrote ${changed.length} files. Next, from the repo root: npm install (registers the new workspace), then npm test`);
