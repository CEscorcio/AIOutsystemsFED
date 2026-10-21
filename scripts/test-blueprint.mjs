// The blueprint's own test: makes a new project from this repo in a temporary
// folder and walks it through its first release, the way a team would:
//   init -> scaffold a component -> build:all -> generate the O11 lambdas ->
//   a release commit without a record (must be refused) -> record -> release commit
// It checks each step's result. If this fails, projects made from the
// blueprint are broken, even when this repo's own tests pass.
//
// Usage (from the repo root, after npm install): npm run test:blueprint
// It copies the working tree (uncommitted changes included) and shares this
// repo's node_modules through a link; nothing here is changed.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const root = join(import.meta.dirname, '..');
const tmp = mkdtempSync(join(tmpdir(), 'blueprint-'));
const link = join(tmp, 'node_modules');
let step = 0;

const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { cwd: tmp, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts });
const git = (...args) => run('git', ['-c', 'user.name=Blueprint Test', '-c', 'user.email=blueprint@example.invalid', '-c', 'commit.gpgsign=false', ...args]);
const node = (...args) => run(process.execPath, args);
const read = (path) => readFileSync(join(tmp, path), 'utf8');
function check(what, ok, detail = '') {
	step += 1;
	if (!ok) throw new Error(`step ${step}, ${what}${detail ? `: ${detail}` : ''}`);
	console.log(`ok ${step}  ${what}`);
}

try {
	// A copy of the working tree, as a fresh repository.
	const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' })
		.split('\n')
		.filter((f) => f && existsSync(join(root, f)));
	for (const f of files) {
		mkdirSync(dirname(join(tmp, f)), { recursive: true });
		cpSync(join(root, f), join(tmp, f));
	}
	symlinkSync(join(root, 'node_modules'), link, process.platform === 'win32' ? 'junction' : 'dir');
	git('init', '-q', '-b', 'main');
	git('add', '-A');
	git('commit', '-q', '-m', 'Blueprint');
	node('scripts/install-hooks.mjs');
	check('copied the blueprint into a new repository', existsSync(join(tmp, 'factory.config.json')));

	node('scripts/init.mjs', '--project', 'AcmePortal', '--namespace', 'Acme', '--theme', 'AcmeTheme', '--yes');
	const config = JSON.parse(read('factory.config.json'));
	check('init wrote the config', config.project === 'AcmePortal' && config.namespace === 'Acme' && config.o11.theme === 'AcmeTheme');
	check('init emptied the previous project', !existsSync(join(tmp, 'dist', 'components.js')) && !read('CHANGELOG.md').includes('## 2') && !read('docs/project/Releases.md').includes('## 2'));
	git('add', '-A');
	git('commit', '-q', '-m', 'Start AcmePortal from the blueprint');
	node('scripts/check-links.mjs');
	check('every link in the new project resolves', true);

	node('.claude/skills/new-pattern/scaffold.mjs', 'StatusBadge');
	const contract = JSON.parse(read('components/status-badge/component.json'));
	check('the scaffold used the project namespace', contract.namespace === 'Acme' && read('components/status-badge/src/index.ts').includes('w.Acme.StatusBadge'));
	git('add', '-A');
	git('commit', '-q', '-m', 'Add StatusBadge');

	node('scripts/build-all.mjs');
	const js = read('dist/components.js');
	const version = (js.match(/^ \* Version: (\S+)$/m) || [])[1];
	check('build:all ran every check and wrote the release', !!version && js.includes(' * AcmePortal components') && js.includes('components/status-badge/dist/StatusBadge.js'));

	node('platform/o11/generate.mjs', 'block', 'status-badge');
	node('platform/o11/generate.mjs', 'theme');
	check('the generators used the project names', read('platform/o11/out/block-status-badge.cs').includes('new Acme.StatusBadge(') && read('platform/o11/out/theme.cs').includes('@"AcmeTheme"'));

	git('add', 'dist');
	let refused = false;
	try {
		git('commit', '-q', '-m', 'Release without a record');
	} catch {
		refused = true;
	}
	check('the hook refused a release commit without its record', refused);

	node('scripts/release-record.mjs', '--environment', 'dev', '--module', 'AcmePortal', '--theme', 'AcmeTheme', '--description', 'Blueprint test release');
	git('add', '-A');
	git('commit', '-q', '-m', `Release ${version}`);
	const committed = git('show', '--name-only', '--format=', 'HEAD').split('\n');
	check(
		'the release commit carries its record, the releases page and the changelog entry',
		['CHANGELOG.md', 'docs/project/Releases.md', `releases/${version}.json`, 'dist/components.js'].every((f) => committed.includes(f)),
		committed.join(', '),
	);
	const record = JSON.parse(read(`releases/${version}.json`));
	check('the record is the project’s first release', record.previousVersion === null && record.contractChanges.some((c) => c.change === 'component added'));
	check('the changelog starts at the project, not the blueprint', read('CHANGELOG.md').includes('First release') && !read('CHANGELOG.md').includes('Rename the project'));

	console.log(`\ntest-blueprint: a new project from this blueprint reaches its first release (${step} checks)`);
} catch (e) {
	console.error(`\ntest-blueprint: FAILED at ${e.message}`);
	// Prettier warns about two ignored options on every run (README, Limitations); leave them out.
	const output = `${e.stdout || ''}\n${e.stderr || ''}`.split('\n').filter((l) => l.trim() && !l.includes('Ignored unknown option'));
	if (output.length) console.error(output.slice(-20).join('\n'));
	process.exitCode = 1;
} finally {
	// Remove the link first, so deleting the folder can never reach the real node_modules.
	try {
		unlinkSync(link);
	} catch {
		// not created
	}
	if (!existsSync(join(root, 'node_modules', '.bin'))) console.error('test-blueprint: the real node_modules looks damaged; run npm install');
	rmSync(tmp, { recursive: true, force: true });
}
