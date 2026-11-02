// Release notes for a build of dist/components.js and dist/components.css,
// compared with the release before it:
//   - which components were added, removed, or changed (JS, CSS), read from
//     the combined files' sections
//   - the commits since the previous release, split into component changes
//     and tooling/docs
//
// Usage (from the repo root):
//   node scripts/release-notes.mjs                prints notes for the build in dist/
//   node scripts/release-notes.mjs --commit <rev> prints notes for the release committed in <rev>
//   node scripts/release-notes.mjs --hook         the pre-commit hook (.githooks/pre-commit):
//                                                 when the staged dist/components.js has a new
//                                                 version, adds its notes to CHANGELOG.md and
//                                                 stages it; otherwise does nothing
// Add --write to the first two to add the notes to CHANGELOG.md as well.
//
// The previous release is the last commit before the new one that changed
// dist/components.js (releases are committed only when uploaded; AGENTS.md).
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { writePage } from './lib/releases.mjs';

const root = join(import.meta.dirname, '..');
const changelogPath = join(root, 'CHANGELOG.md');
const args = process.argv.slice(2);
const hook = args.includes('--hook');
const write = hook || args.includes('--write');
const commitArg = args.includes('--commit') ? args[args.indexOf('--commit') + 1] : null;

function fail(message) {
	console.error(`release-notes: ${message}`);
	process.exit(1);
}

function git(...gitArgs) {
	return execFileSync('git', gitArgs, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] })
		.toString()
		.replace(/\r\n/g, '\n');
}

// A file's text at a git revision (':path' is the index), or null.
function show(spec) {
	try {
		return git('show', spec);
	} catch {
		return null;
	}
}

function revParse(rev) {
	try {
		return git('rev-parse', '--verify', '--quiet', `${rev}^{commit}`).trim();
	} catch {
		return null;
	}
}

// The header build-all.mjs writes: version, build time and contents.
function parseHeader(text) {
	const version = text && text.match(/^ \* Version: (\d+\.\d+\.\d+)$/m);
	if (!version) return null;
	const built = text.match(/^ \* Built: (\S+)$/m);
	return { version: version[1], built: built ? built[1] : null };
}

// A release's components and their own builds. The stylesheet lists each
// component with a marker (/* ---- components/<folder>/dist/<Class>.css ---- */);
// each is compared by its committed build, components/<folder>/dist/<Class>.js
// and .css, read from the same place as the release (a commit, the index or
// the working tree), so it works whatever the bundle's format.
function builds(cssText, readFile) {
	const out = new Map();
	for (const m of (cssText || '').matchAll(/^\/\* ---- components\/([^/]+)\/dist\/(\S+)\.css ---- \*\/$/gm)) {
		out.set(m[1], { js: readFile(`components/${m[1]}/dist/${m[2]}.js`) ?? undefined, css: readFile(`components/${m[1]}/dist/${m[2]}.css`) ?? undefined });
	}
	return out;
}

function compare(oldText, newText) {
	if (oldText === newText) return null;
	if (oldText !== undefined && newText !== undefined && oldText.replace(/\s+/g, '') === newText.replace(/\s+/g, '')) return 'whitespace only';
	return 'changed';
}

// Where the new build comes from, and the commit range its notes cover.
let newJs, newCss, tip, readNew;
if (commitArg) {
	const rev = revParse(commitArg) || fail(`"${commitArg}" is not a commit`);
	readNew = (path) => show(`${rev}:${path}`);
	if (!git('diff-tree', '--no-commit-id', '--name-only', '-r', '--root', rev, '--', 'dist/components.js').trim()) fail(`${commitArg} doesn't change dist/components.js, so it isn't a release`);
	tip = revParse(`${rev}^`);
} else if (hook) {
	readNew = (path) => show(`:${path}`);
	tip = revParse('HEAD');
} else {
	readNew = (path) => (existsSync(join(root, path)) ? readFileSync(join(root, path), 'utf8').replace(/\r\n/g, '\n') : null);
	tip = revParse('HEAD');
}
newJs = readNew('dist/components.js');
newCss = readNew('dist/components.css');

const next = parseHeader(newJs);
if (!next) {
	if (hook) process.exit(0);
	fail('no versioned dist/components.js found; run npm run build:all first');
}

// The previous release: the last commit up to tip that changed dist/components.js
// to a versioned build (early test builds were committed without a version). A
// commit that deleted it ends the search: that's npm run init starting a new
// project, and the blueprint's releases before it aren't this project's.
let base = null;
let oldJs = null;
let projectStart = null;
for (const rev of tip ? git('log', '--format=%H', tip, '--', 'dist/components.js').split('\n').filter(Boolean) : []) {
	const text = show(`${rev}:dist/components.js`);
	if (text === null) {
		projectStart = rev;
		break;
	}
	if (parseHeader(text)) {
		[base, oldJs] = [rev, text];
		break;
	}
}
const oldCss = base ? show(`${base}:dist/components.css`) : null;
const previous = parseHeader(oldJs);

if (previous && previous.version === next.version) {
	if (hook) process.exit(0);
	fail(`dist/components.js is still version ${next.version}, the last committed release; run npm run build:all for a new one`);
}
if (hook && newCss && parseHeader(newCss)?.version !== next.version) {
	fail(
		`the staged dist/components.css isn't from the same build as dist/components.js (${parseHeader(newCss)?.version || 'no version'} vs ${next.version}); stage both files from one npm run build:all`,
	);
}

// A release commit carries its record (releases/<version>.json, from npm run
// release:record), recorded for exactly these files; docs/project/Releases.md is
// regenerated from the records and staged with it.
if (hook) {
	const recordText = show(`:releases/${next.version}.json`);
	if (!recordText) fail(`stage releases/${next.version}.json with the release: run npm run release:record -- --description "..." --environment <label> --module <Module>, then git add releases/`);
	const record = JSON.parse(recordText);
	const sha = (text) => createHash('sha256').update(text).digest('hex');
	if (record.files['dist/components.js'].sha256 !== sha(newJs) || record.files['dist/components.css'].sha256 !== sha(newCss || '')) {
		fail(`releases/${next.version}.json was recorded for other files than the staged dist/; run npm run release:record again on this build`);
	}
	writePage();
	git('add', 'docs/project/Releases.md');
}

// Components: added, removed, changed.
const before = builds(oldCss, (path) => show(`${base}:${path}`));
const after = builds(newCss, readNew);
const names = [...new Set([...before.keys(), ...after.keys()])].sort();
const componentLines = [];
const unchanged = [];
for (const name of names) {
	if (!before.has(name)) componentLines.push(`- **${name}**: added`);
	else if (!after.has(name)) componentLines.push(`- **${name}**: removed`);
	else {
		const parts = [
			['JS', compare(before.get(name).js, after.get(name).js)],
			['CSS', compare(before.get(name).css, after.get(name).css)],
		]
			.filter(([, c]) => c)
			.map(([what, c]) => (c === 'changed' ? what : `${what} (${c})`));
		if (parts.length) componentLines.push(`- **${name}**: ${parts.join(', ')} changed`);
		else unchanged.push(name);
	}
}
if (unchanged.length) componentLines.push(`- Unchanged: ${unchanged.join(', ')}`);

// Commits since the previous release (or the whole history for the first one),
// split by whether they touched a component (components/<name>/, or <name>/ from
// before the components/ folder existed).
const commitLines = { components: [], other: [] };
if (tip) {
	const from = base || projectStart;
	const range = from ? `${from}..${tip}` : tip;
	const log = git('log', '--no-merges', '--format=%x1e%h%x1f%s', '--name-only', range);
	for (const entry of log.split('\x1e').filter((e) => e.trim())) {
		const [first, ...files] = entry.trim().split('\n');
		const [hash, subject] = first.split('\x1f');
		const touchesComponents = files.some((f) => f.startsWith('components/') || names.some((n) => f.startsWith(`${n}/`)));
		commitLines[touchesComponents ? 'components' : 'other'].push(`- ${subject} (${hash})`);
	}
}

const date = (next.built || new Date().toISOString()).slice(0, 10);
const since = previous ? `since ${previous.version}` : 'up to this release';
// "dist/components.js 2.9 KB (+0.3 KB)": the size, and the change since the previous release.
const size = (file, text, oldText) => {
	const kb = (t) => Buffer.byteLength(t || '') / 1024;
	if (!text) return `${file} missing`;
	const delta = oldText ? kb(text) - kb(oldText) : null;
	const change = delta === null ? '' : Math.abs(delta) < 0.05 ? ' (no change)' : ` (${delta > 0 ? '+' : ''}${delta.toFixed(1)} KB)`;
	return `${file} ${kb(text).toFixed(1)} KB${change}`;
};
const notes = [
	`## ${next.version} (${date})`,
	'',
	`Built ${next.built || 'at an unknown time'}${previous ? `. Previous release: ${previous.version}` : '. First release'}.`,
	'',
	`Size: ${size('dist/components.js', newJs, oldJs)}, ${size('dist/components.css', newCss, oldCss)}.`,
	'',
	'### Components',
	'',
	...componentLines,
	'',
	...(commitLines.components.length ? [`### Component commits ${since}`, '', ...commitLines.components, ''] : []),
	...(commitLines.other.length ? [`### Tooling and docs ${since}`, '', ...commitLines.other, ''] : []),
]
	.join('\n')
	.trimEnd();

if (!write) {
	console.log(notes);
	process.exit(0);
}

// CHANGELOG.md: newest first, one "## <version>" section per release. A
// version that's already there is left alone (the hook runs again when a
// commit is retried).
const intro = [
	'# Changelog',
	'',
	'Release notes for `dist/components.js` and `dist/components.css`, newest first. The pre-commit hook adds a section when a commit includes a new version ([scripts/release-notes.mjs](scripts/release-notes.mjs)); the commit message says where the release was uploaded.',
	'',
].join('\n');
let changelog = intro;
try {
	changelog = readFileSync(changelogPath, 'utf8').replace(/\r\n/g, '\n');
} catch (e) {
	if (e.code !== 'ENOENT') throw e;
}
// Is this version's section already there (a retried commit)? Compared line by line, no regex.
if (changelog.split('\n').some((line) => line === `## ${next.version}` || line.startsWith(`## ${next.version} `))) {
	console.log(`release-notes: CHANGELOG.md already has ${next.version}`);
} else {
	const at = changelog.search(/^## /m);
	const updated = at === -1 ? `${changelog.trimEnd()}\n\n${notes}\n` : `${changelog.slice(0, at)}${notes}\n\n${changelog.slice(at)}`;
	writeFileSync(changelogPath, updated);
	console.log(`release-notes: added ${next.version} to CHANGELOG.md`);
}
if (hook) git('add', 'CHANGELOG.md');
