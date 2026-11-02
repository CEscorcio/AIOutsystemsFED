// Build rule: every relative link in the repo's Markdown points at a file that
// exists, and every #anchor at a heading in that file (GitHub's heading ids).
// Part of npm run lint.
//
// Usage (from the repo root): node scripts/check-links.mjs
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const root = join(import.meta.dirname, '..');
const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '*.md'], { cwd: root })
	.toString()
	.split('\n')
	.filter((f) => f && existsSync(join(root, f)) && !f.includes('node_modules/'));

// GitHub's heading id: lowercase, punctuation dropped, spaces to hyphens, repeats numbered.
function anchors(path) {
	const seen = new Map();
	const ids = new Set();
	let fence = false;
	for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
		if (/^\s*```/.test(line)) fence = !fence;
		const m = !fence && line.match(/^#{1,6}\s+(.*?)\s*#*\s*$/);
		if (!m) continue;
		const base = m[1]
			.replace(/`/g, '')
			.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
			.toLowerCase()
			.replace(/[^\p{L}\p{N}\s_-]/gu, '')
			.replace(/\s/g, '-');
		const n = seen.get(base) || 0;
		seen.set(base, n + 1);
		ids.add(n ? `${base}-${n}` : base);
	}
	return ids;
}

const problems = [];
for (const file of files) {
	const text = readFileSync(join(root, file), 'utf8').replace(/```[\s\S]*?```/g, '');
	for (const m of text.matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
		const target = m[1];
		if (/^[a-z]+:/i.test(target) || target.startsWith('mailto:')) continue;
		const [path, anchor] = target.split('#');
		const abs = path ? resolve(dirname(join(root, file)), decodeURIComponent(path)) : join(root, file);
		if (!existsSync(abs)) {
			problems.push(`${file}: ${target} (no such file)`);
			continue;
		}
		if (anchor && statSync(abs).isFile() && abs.endsWith('.md') && !anchors(abs).has(anchor.toLowerCase()))
			problems.push(`${file}: ${target} (no heading #${anchor} in ${relative(root, abs).replace(/\\/g, '/')})`);
	}
}

if (problems.length) {
	console.error(`check-links: ${problems.length} broken link${problems.length === 1 ? '' : 's'}\n${problems.map((p) => `  - ${p}`).join('\n')}`);
	process.exit(1);
}
console.log(`check-links: all links in ${files.length} Markdown files resolve`);
