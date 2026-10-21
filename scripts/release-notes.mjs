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
// dist/components.js (releases are committed only when uploaded; docs/AGENTS.md).
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

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

// Splits a combined file into its components' sections, keyed by folder name
// (components/<name>/dist/<File>.<ext>). Several files of one component are joined.
function sections(text, ext) {
	const out = new Map();
	if (!text) return out;
	const marker = ext === 'js' ? /^\/\/ ---- components\/([^/]+)\/dist\/\S+\.js ----$/gm : /^\/\* ---- components\/([^/]+)\/dist\/\S+\.css ---- \*\/$/gm;
	const found = [...text.matchAll(marker)];
	found.forEach((m, i) => {
		const body = text.slice(m.index + m[0].length, i + 1 < found.length ? found[i + 1].index : undefined).trim();
		out.set(m[1], (out.has(m[1]) ? `${out.get(m[1])}\n` : '') + body);
	});
	return out;
}

function compare(oldText, newText) {
	if (oldText === newText) return null;
	if (oldText !== undefined && newText !== undefined && oldText.replace(/\s+/g, '') === newText.replace(/\s+/g, '')) return 'whitespace only';
	return 'changed';
}

// Where the new build comes from, and the commit range its notes cover.
let newJs, newCss, tip;
if (commitArg) {
	const rev = revParse(commitArg) || fail(`"${commitArg}" is not a commit`);
	newJs = show(`${rev}:dist/components.js`);
	newCss = show(`${rev}:dist/components.css`);
	if (!git('diff-tree', '--no-commit-id', '--name-only', '-r', '--root', rev, '--', 'dist/components.js').trim()) fail(`${commitArg} doesn't change dist/components.js, so it isn't a release`);
	tip = revParse(`${rev}^`);
} else if (hook) {
	newJs = show(':dist/components.js');
	newCss = show(':dist/components.css');
	tip = revParse('HEAD');
} else {
	const read = (f) => (existsSync(join(root, 'dist', f)) ? readFileSync(join(root, 'dist', f), 'utf8').replace(/\r\n/g, '\n') : null);
	newJs = read('components.js');
	newCss = read('components.css');
	tip = revParse('HEAD');
}

const next = parseHeader(newJs);
if (!next) {
	if (hook) process.exit(0);
	fail('no versioned dist/components.js found; run npm run build:all first');
}

// The previous release: the last commit up to tip that changed dist/components.js
// to a versioned build (early test builds were committed without a version).
let base = null;
let oldJs = null;
for (const rev of tip ? git('log', '--format=%H', tip, '--', 'dist/components.js').split('\n').filter(Boolean) : []) {
	const text = show(`${rev}:dist/components.js`);
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

// Components: added, removed, changed.
const [jsOld, jsNew, cssOld, cssNew] = [sections(oldJs, 'js'), sections(newJs, 'js'), sections(oldCss, 'css'), sections(newCss, 'css')];
const names = [...new Set([...jsOld.keys(), ...jsNew.keys(), ...cssOld.keys(), ...cssNew.keys()])].sort();
const componentLines = [];
const unchanged = [];
for (const name of names) {
	const inOld = jsOld.has(name) || cssOld.has(name);
	const inNew = jsNew.has(name) || cssNew.has(name);
	if (!inOld) componentLines.push(`- **${name}**: added`);
	else if (!inNew) componentLines.push(`- **${name}**: removed`);
	else {
		const parts = [
			['JS', compare(jsOld.get(name), jsNew.get(name))],
			['CSS', compare(cssOld.get(name), cssNew.get(name))],
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
	const range = base ? `${base}..${tip}` : tip;
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
const notes = [
	`## ${next.version} (${date})`,
	'',
	`Built ${next.built || 'at an unknown time'}${previous ? `. Previous release: ${previous.version}` : '. First release'}.`,
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
const changelog = existsSync(changelogPath) ? readFileSync(changelogPath, 'utf8').replace(/\r\n/g, '\n') : intro;
if (new RegExp(`^## ${next.version.replace(/\./g, '\\.')}\\b`, 'm').test(changelog)) {
	console.log(`release-notes: CHANGELOG.md already has ${next.version}`);
} else {
	const at = changelog.search(/^## /m);
	const updated = at === -1 ? `${changelog.trimEnd()}\n\n${notes}\n` : `${changelog.slice(0, at)}${notes}\n\n${changelog.slice(at)}`;
	writeFileSync(changelogPath, updated);
	console.log(`release-notes: added ${next.version} to CHANGELOG.md`);
}
if (hook) git('add', 'CHANGELOG.md');
