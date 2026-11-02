// Turns a fresh copy of this blueprint into a new project: its own settings,
// and none of the previous project's components, releases or records.
//
// Usage (from the repo root, in a copy made with GitHub's "Use this template"):
//   npm run init -- --project <Name> --namespace <Namespace> [--outsystems-ui <version>]
//                   [--owner <github-user-or-org/team>] [--theme <Theme>] [--flow <Flow>] [--block-flow <Flow>] [--script <Script>] [--keep-components] [--yes]
//
// Without --yes it only prints what it would do. With --yes it does it; the git
// working tree must be clean, so everything it changed shows in one diff.
//
// What it does:
//   - factory.config.json: project, namespace, OutSystems UI version, O11 names; the
//     previous project's "traditional" section is dropped
//   - .github/CODEOWNERS: the owner, or no owners without --owner
//   - package.json and package-lock.json: the package name, and the outsystems-ui pin
//   - README.md: the project name and namespace
//   - empties the release history: releases/, dist/components.*, CHANGELOG.md,
//     docs/project/ (its README is rewritten for the new project), then regenerates
//     docs/project/Releases.md
//   - removes components/* (the previous project's components), unless --keep-components
//   - rebuilds the committed dist/ of templates and kept components for the new namespace
//   - removes factory.config.local.json, the previous environment's names
// The guide (docs/guide/), the tooling and templates/ stay as they are.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { readmes, renderReadme } from './lib/component-docs.mjs';
import { configPath, localConfigPath, validateConfig } from './lib/config.mjs';
import { componentsDir, root } from './lib/contract.mjs';
import { releasesDir, writePage } from './lib/releases.mjs';

const args = process.argv.slice(2);
const option = (name) => {
	const i = args.indexOf(`--${name}`);
	return i === -1 ? undefined : args[i + 1];
};
const flag = (name) => args.includes(`--${name}`);
const apply = flag('yes');

function fail(message) {
	console.error(`init: ${message}`);
	process.exit(1);
}

const before = JSON.parse(readFileSync(configPath, 'utf8'));
const project = option('project');
const namespace = option('namespace');
if (!project || !namespace) fail('usage: npm run init -- --project <Name> --namespace <Namespace> [--outsystems-ui <version>] [--theme <Theme>] [--yes]');
const config = {
	...before,
	project,
	namespace,
	outsystemsUi: option('outsystems-ui') || before.outsystemsUi,
	o11: {
		...before.o11,
		...(option('theme') ? { theme: option('theme') } : {}),
		...(option('flow') ? { flow: option('flow') } : {}),
		...(option('block-flow') ? { blockFlow: option('block-flow') } : {}),
		...(option('script') ? { script: option('script') } : {}),
	},
};
delete config.traditional;
const errors = validateConfig(config);
if (errors.length) fail(errors.join('\n'));

const rel = (p) =>
	p
		.replace(root, '')
		.replace(/^[\\/]/, '')
		.replace(/\\/g, '/');
const actions = [];
const plan = (text, run) => actions.push({ text, run });

plan(
	`factory.config.json: project "${config.project}", namespace ${config.namespace}, OutSystems UI ${config.outsystemsUi}, theme ${config.o11.theme}, flow ${config.o11.flow}, blocks in ${config.o11.blockFlow}, script ${config.o11.script}`,
	() => writeFileSync(configPath, `${JSON.stringify(config, null, '\t')}\n`),
);

const pkgPath = join(root, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const npmName = config.project
	.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
	.replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
	.replace(/[\s_]+/g, '-')
	.toLowerCase();
plan(`package.json: name "${npmName}", outsystems-ui pinned to ${config.outsystemsUi}`, () => {
	pkg.name = npmName;
	pkg.devDependencies['outsystems-ui'] = config.outsystemsUi;
	writeFileSync(pkgPath, `${JSON.stringify(pkg, null, '\t')}\n`);
	const lockPath = join(root, 'package-lock.json');
	if (existsSync(lockPath)) {
		const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
		lock.name = npmName;
		if (lock.packages && lock.packages['']) lock.packages[''].name = npmName;
		writeFileSync(lockPath, `${JSON.stringify(lock, null, '\t')}\n`);
	}
});

const owner = option('owner');
if (owner && !/^[A-Za-z0-9][A-Za-z0-9-]*(\/[A-Za-z0-9._-]+)?$/.test(owner)) fail('--owner must be a GitHub user or org/team, without the @');
const ownersPath = join(root, '.github', 'CODEOWNERS');
if (existsSync(ownersPath)) {
	plan(owner ? `.github/CODEOWNERS: owned by @${owner}` : '.github/CODEOWNERS: no owners (pass --owner to set one)', () => {
		const lines = readFileSync(ownersPath, 'utf8').split('\n');
		const next = lines.map((l) => (l.startsWith('#') || !l.trim() ? l : owner ? l.replace(/@\S+/g, `@${owner}`) : `# ${l.replace(/\s+@\S+/g, '')}`));
		writeFileSync(ownersPath, next.join('\n'));
	});
}

const readmePath = join(root, 'README.md');
if (before.project !== config.project) {
	plan(`README.md: "${before.project}" -> "${config.project}"`, () =>
		writeFileSync(readmePath, readFileSync(readmePath, 'utf8').split(before.project).join(config.project).split(before.namespace).join(config.namespace)),
	);
}

const remove = [];
if (existsSync(localConfigPath)) remove.push(localConfigPath);
if (existsSync(releasesDir)) remove.push(...readdirSync(releasesDir).map((f) => join(releasesDir, f)));
for (const f of ['components.js', 'components.css']) if (existsSync(join(root, 'dist', f))) remove.push(join(root, 'dist', f));
const projectDocs = join(root, 'docs', 'project');
if (existsSync(projectDocs))
	remove.push(
		...readdirSync(projectDocs)
			.filter((f) => f !== 'README.md')
			.map((f) => join(projectDocs, f)),
	);
if (!flag('keep-components') && existsSync(componentsDir)) {
	remove.push(
		...readdirSync(componentsDir)
			.filter((f) => statSync(join(componentsDir, f)).isDirectory())
			.map((f) => join(componentsDir, f)),
	);
}
for (const path of remove) plan(`remove ${rel(path)}`, () => rmSync(path, { recursive: true, force: true }));

plan('CHANGELOG.md: no releases yet', () =>
	writeFileSync(
		join(root, 'CHANGELOG.md'),
		'# Changelog\n\nRelease notes for `dist/components.js` and `dist/components.css`, newest first. The pre-commit hook adds a section when a commit includes a new version ([scripts/release-notes.mjs](scripts/release-notes.mjs)); the commit message says where the release was uploaded.\n',
	),
);
plan('docs/project/README.md: a new project page', () =>
	writeFileSync(
		join(root, 'docs', 'project', 'README.md'),
		"# Project records\n\nThis project's own documents, as opposed to the factory's guide in [../guide/](../guide/):\n\n- [Releases.md](Releases.md): every release, generated from `releases/` by `npm run release:record`; don't edit it\n- run logs: what happened when something was done for the first time in this project, one file each (`<What>-<date>.md`)\n- decisions that only apply to this project\n\nWhat a log teaches that would hold in any project goes into the guide instead, usually [PlatformNotes.md](../guide/PlatformNotes.md).\n\n## Status\n\n- **Components:** none yet. Create the first one from the template (docs/guide/NewComponent.md).\n\n## Next steps\n\n1. Build the first component\n",
	),
);
plan('docs/project/Releases.md: regenerated, empty', () => writePage());
// Component READMEs name the namespace, so they follow the new config.
plan(`templates' and components' README.md: regenerated for window.${config.namespace}`, () => {
	for (const r of readmes()) writeFileSync(r.path, renderReadme(r.contract, config.namespace));
});

// Their committed builds name the namespace too, so CI's dist drift check would fail.
plan("templates' and kept components' dist/: rebuilt for the new namespace", async () => {
	const { buildComponent } = await import('../packages/toolchain/build.mjs');
	for (const r of readmes()) await buildComponent(dirname(r.path));
});

if (!apply) {
	console.log(`init: would do ${actions.length} things (nothing changed; add --yes to do them):`);
	for (const a of actions) console.log(`  - ${a.text}`);
	process.exit(0);
}

let dirty = '';
try {
	dirty = execFileSync('git', ['status', '--porcelain'], { cwd: root }).toString().trim();
} catch {
	fail('not a git repository; init needs git to show what it changed');
}
if (dirty) fail('the working tree has changes; commit or stash them first, so what init changes is one clean diff');

for (const a of actions) {
	await a.run();
	console.log(`  done: ${a.text}`);
}
console.log(`\ninit: ${config.project} is ready. Next:
  npm install                                       (the package name and outsystems-ui pin changed)
  npm test
  node .claude/skills/new-pattern/scaffold.mjs <Component>   (your first component, on window.${config.namespace})
  git add -A && git commit -m "Start ${config.project} from the blueprint"`);
