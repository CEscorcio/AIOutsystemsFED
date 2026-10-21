// Build rule: no high or critical npm advisory, except the ones accepted below
// with a reason. Runs in CI; locally: npm run check:audit.
//
// npm audit reports a package as vulnerable when anything below it is, so one
// advisory can show as many packages. This check looks at the advisories
// themselves, so accepting one doesn't hide a new one in the same packages.
import { execSync } from 'node:child_process';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');

// Each accepted advisory: why it doesn't apply here, and when to look again.
const ACCEPTED = {
	'GHSA-vfj7-8cjw-p6xm':
		'braces <=3.0.3, stack exhaustion on deeply nested glob patterns. Only reached through stylelint, a dev tool that globs our own fixed patterns (package.json "lint"); no patterns come from users. No fixed braces 3.x existed when accepted (2026-10-21). Drop this when stylelint ships a fixed chain.',
};

let report;
try {
	report = execSync('npm audit --json', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
} catch (e) {
	// npm audit exits non-zero when it finds anything; the JSON is still on stdout.
	report = e.stdout ? e.stdout.toString() : '';
}
if (!report) {
	console.error('check-audit: npm audit returned nothing (offline?)');
	process.exit(1);
}

const { vulnerabilities = {} } = JSON.parse(report);
const advisories = new Map();
for (const v of Object.values(vulnerabilities)) {
	for (const via of v.via) {
		if (typeof via !== 'object') continue;
		const id = (via.url || '').split('/').pop();
		if (!['high', 'critical'].includes(via.severity)) continue;
		advisories.set(id, `${via.name} ${via.range}: ${via.title} (${via.severity})`);
	}
}

const unaccepted = [...advisories].filter(([id]) => !ACCEPTED[id]);
const stale = Object.keys(ACCEPTED).filter((id) => !advisories.has(id));
for (const id of stale) console.log(`check-audit: ${id} is accepted but no longer reported; remove it from scripts/check-audit.mjs`);
if (unaccepted.length) {
	console.error(`check-audit: ${unaccepted.length} high or critical advisor${unaccepted.length === 1 ? 'y' : 'ies'} not accepted:\n${unaccepted.map(([id, t]) => `  - ${id}: ${t}`).join('\n')}`);
	console.error('Update the dependency, or accept it in scripts/check-audit.mjs with the reason it does not apply.');
	process.exit(1);
}
console.log(`check-audit: no unaccepted high or critical advisories (${advisories.size} accepted)`);
