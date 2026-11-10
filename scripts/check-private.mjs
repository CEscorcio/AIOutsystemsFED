// Build rule: nothing private reaches the repo. Scans every tracked and new file for
// secrets, OutSystems server hostnames and a private list of forbidden words, and prints
// where, never the value it found. Personal settings files (settings.local.json, .env)
// are refused whatever they contain.
//
// The word list stays out of the repo, because committing it would publish it: one word
// or module name per line in .forbidden-words (ignored by git; # starts a comment), and in
// CI the secret FORBIDDEN_WORDS (comma-separated). Words match whole, ignoring case.
//
// Usage (from the repo root):
//   node scripts/check-private.mjs             the files (part of npm run lint)
//   node scripts/check-private.mjs --history   also every commit message and diff
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 1 << 30 });

const PATTERNS = [
	['a GitHub token', /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})/],
	['an AWS key', /\bAKIA[0-9A-Z]{16}\b/],
	['an API key', /\bsk-[A-Za-z0-9_-]{20,}/],
	['a Slack token', /\bxox[abprs]-[A-Za-z0-9-]{10,}/],
	['a private key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
	['a JSON Web Token', /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\./],
	['a password or secret', /\b(?:password|passwd|pwd|client[_-]?secret|api[_-]?key|access[_-]?token|auth[_-]?token)["' ]*[:=]["' ]*[A-Za-z0-9_+/-]{8,}/i],
	['an OutSystems server address', /\b[a-z0-9-]+\.outsystemscloud\.com\b/i],
];

const escape = (word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wordsFile = join(root, '.forbidden-words');
const words = [...(existsSync(wordsFile) ? readFileSync(wordsFile, 'utf8').split(/\r?\n/) : []), ...(process.env.FORBIDDEN_WORDS || '').split(',')]
	.map((w) => w.replace(/#.*$/, '').trim())
	.filter(Boolean);
words.forEach((word, i) => PATTERNS.push([`forbidden word ${i + 1}`, new RegExp(`(?<![A-Za-z0-9])${escape(word)}(?![A-Za-z0-9])`, 'i')]));

// The patterns themselves live here, and the lockfile holds only hashes of public packages.
const SKIP = new Set(['scripts/check-private.mjs', 'package-lock.json']);
const problems = [];
const files = git('ls-files', '--cached', '--others', '--exclude-standard')
	.split('\n')
	.filter((f) => f && !SKIP.has(f) && existsSync(join(root, f)) && statSync(join(root, f)).isFile());
for (const file of files) {
	const text = readFileSync(join(root, file), 'utf8');
	if (text.includes('\0')) continue;
	text.split('\n').forEach((line, i) => {
		for (const [what, pattern] of PATTERNS) if (pattern.test(line)) problems.push(`${file}:${i + 1}: ${what}`);
	});
}
// Files that hold personal settings or credentials are never committed, whatever they contain.
for (const file of files) if (/(^|\/)(settings\.local\.json|\.env(\.[^/]*)?)$/.test(file) && !file.endsWith('.example')) problems.push(`${file}: a personal settings or credentials file`);

const history = process.argv.includes('--history');
if (history) {
	for (const hash of git('rev-list', '--all').split('\n').filter(Boolean)) {
		const text = git('show', '--format=%B', hash, '--', '.', ':!package-lock.json', ':!scripts/check-private.mjs');
		for (const [what, pattern] of PATTERNS) if (pattern.test(text)) problems.push(`commit ${hash.slice(0, 7)}: ${what}`);
	}
}

if (problems.length) {
	console.error(`check-private: ${problems.length} problem${problems.length === 1 ? '' : 's'}\n${problems.map((p) => `  - ${p}`).join('\n')}`);
	process.exit(1);
}
console.log(`check-private: ${files.length} files clean${history ? ', and the history' : ''} (${words.length} forbidden word${words.length === 1 ? '' : 's'})`);
