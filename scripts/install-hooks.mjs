// Points git at the repo's hooks in .githooks/ (run by npm install, through the
// prepare script). Does nothing outside a git work tree, e.g. in a package
// tarball or a CI checkout without .git.
import { execFileSync } from 'node:child_process';

const git = (...args) =>
	execFileSync('git', args, { stdio: ['ignore', 'pipe', 'ignore'] })
		.toString()
		.trim();

try {
	if (git('rev-parse', '--is-inside-work-tree') !== 'true') process.exit(0);
} catch {
	process.exit(0);
}
if (git('config', '--local', '--default', '', 'core.hooksPath') !== '.githooks') {
	git('config', '--local', 'core.hooksPath', '.githooks');
	console.log('install-hooks: git now uses .githooks/ (pre-commit adds release notes to CHANGELOG.md)');
}
