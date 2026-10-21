// Records a release in releases/<version>.json and regenerates docs/Releases.md.
// Run it after the build in dist/ has been uploaded and checked, before
// committing the release; the pre-commit hook refuses a release commit
// without its record.
//
// Usage (from the repo root):
//   npm run release:record -- --description "<what this release is for>" \
//     --environment <label> --module <Module> [--theme <Theme>] [--script Components] \
//     [--published <YYYY-MM-DD>] [--verified "<how the served files were checked>"]
//
//   Run it again for a release that already has a record to add a deployment
//   (another environment or module); the files must still match the record.
//
//   --no-deployment         record the release without a deployment
//   --from-commit <rev>     record the release committed in <rev> (backfill)
//   --render                only regenerate docs/Releases.md from the records
//
// Environment labels are names like "personal", "dev", "test", "prod", never
// hostnames (docs/AGENTS.md: keep server URLs out of committed files).
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadContract, root } from './lib/contract.mjs';
import { compareVersions, contractChanges, contractSnapshot, loadReleases, releasesDir, writePage } from './lib/releases.mjs';

const args = process.argv.slice(2);
const option = (name) => {
	const i = args.indexOf(`--${name}`);
	return i === -1 ? undefined : args[i + 1];
};
const flag = (name) => args.includes(`--${name}`);

function fail(message) {
	console.error(`release-record: ${message}`);
	process.exit(1);
}

if (flag('render')) {
	writePage();
	console.log('release-record: wrote docs/Releases.md');
	process.exit(0);
}

const git = (...a) =>
	execFileSync('git', a, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] })
		.toString()
		.replace(/\r\n/g, '\n');
const show = (spec) => {
	try {
		return git('show', spec);
	} catch {
		return null;
	}
};

const fromCommit = option('from-commit');
const read = (path) => (fromCommit ? show(`${fromCommit}:${path}`) : existsSync(join(root, path)) ? readFileSync(join(root, path), 'utf8').replace(/\r\n/g, '\n') : null);
const js = read('dist/components.js');
const css = read('dist/components.css');
if (!js || !css) fail(`dist/components.js and dist/components.css are needed${fromCommit ? ` in ${fromCommit}` : '; run npm run build:all'}`);
const header = (text) => ({ version: (text.match(/^ \* Version: (\S+)$/m) || [])[1], built: (text.match(/^ \* Built: (\S+)$/m) || [])[1] });
const hj = header(js);
const hc = header(css);
if (!hj.version) fail('dist/components.js has no version header');
if (hj.version !== hc.version || hj.built !== hc.built) fail(`dist/components.js (${hj.version}, ${hj.built}) and dist/components.css (${hc.version}, ${hc.built}) aren't from the same build`);

const sha256 = (text) => createHash('sha256').update(text).digest('hex');
const files = {
	'dist/components.js': { bytes: Buffer.byteLength(js), sha256: sha256(js) },
	'dist/components.css': { bytes: Buffer.byteLength(css), sha256: sha256(css) },
};

// Per-component sections of the combined files (the separators build-all.mjs writes).
function sections(text, ext) {
	const marker = ext === 'js' ? /^\/\/ ---- components\/([^/]+)\/dist\/(\S+)\.js ----$/gm : /^\/\* ---- components\/([^/]+)\/dist\/(\S+)\.css ---- \*\/$/gm;
	const found = [...text.matchAll(marker)];
	return new Map(found.map((m, i) => [m[1], { file: m[2], text: text.slice(m.index + m[0].length, i + 1 < found.length ? found[i + 1].index : undefined).trim() }]));
}
const jsParts = sections(js, 'js');
const cssParts = sections(css, 'css');
const components = [...new Set([...jsParts.keys(), ...cssParts.keys()])].sort().map((folder) => {
	let contract = null;
	let meta = {};
	if (fromCommit) {
		const raw = show(`${fromCommit}:components/${folder}/component.json`);
		if (raw) {
			meta = JSON.parse(raw);
			contract = contractSnapshot({ inputs: [], events: [], modifiers: [], ...meta });
		} else {
			// Released before component.json existed: today's contract describes it only if
			// the component's compiled JS is still the same.
			const now = existsSync(join(root, 'dist', 'components.js')) ? sections(readFileSync(join(root, 'dist', 'components.js'), 'utf8').replace(/\r\n/g, '\n'), 'js').get(folder) : null;
			const { contract: c, errors } = loadContract(folder);
			if (now && jsParts.has(folder) && sha256(now.text) === sha256(jsParts.get(folder).text) && c && !errors.length) {
				meta = { ...c, contractSource: "today's component.json (the compiled JS is identical)" };
				contract = contractSnapshot(c);
			}
		}
	} else {
		const { contract: c, errors } = loadContract(folder);
		if (!c || errors.length) fail(`components/${folder}/component.json: ${errors.join('; ') || 'missing'}`);
		meta = c;
		contract = contractSnapshot(c);
	}
	return {
		folder,
		class: meta.class || (jsParts.get(folder) || {}).file || null,
		namespace: meta.namespace || null,
		contract,
		...(meta.contractSource ? { contractSource: meta.contractSource } : {}),
		sha256: { js: jsParts.has(folder) ? sha256(jsParts.get(folder).text) : null, css: cssParts.has(folder) ? sha256(cssParts.get(folder).text) : null },
	};
});

let deployment = null;
if (!flag('no-deployment')) {
	const environment = option('environment');
	const module = option('module');
	if (!environment || !module) fail('give --environment <label> and --module <Module> for the deployment, or --no-deployment');
	if (/[./:]/.test(environment)) fail(`--environment is a label such as "personal" or "dev", not a hostname ("${environment}")`);
	deployment = {
		platform: option('platform') || 'O11',
		environment,
		module,
		script: option('script') || 'Components',
		theme: option('theme') || null,
		published: option('published') || new Date().toISOString().slice(0, 10),
		verified: option('verified') || null,
	};
}

mkdirSync(releasesDir, { recursive: true });
const path = join(releasesDir, `${hj.version}.json`);
const save = (record) => writeFileSync(path, `${JSON.stringify(record, null, '\t')}\n`);

if (existsSync(path)) {
	const record = JSON.parse(readFileSync(path, 'utf8'));
	for (const [file, f] of Object.entries(files)) if (record.files[file].sha256 !== f.sha256) fail(`releases/${hj.version}.json was recorded for a different ${file}; a release's files never change`);
	if (!deployment) fail(`releases/${hj.version}.json already exists; add a deployment with --environment and --module`);
	const same = record.deployments.find((d) => d.environment === deployment.environment && d.module === deployment.module && d.published === deployment.published);
	if (same) fail(`releases/${hj.version}.json already has this deployment (${deployment.environment} / ${deployment.module}, ${deployment.published})`);
	record.deployments.push(deployment);
	save(record);
	console.log(`release-record: added a deployment to releases/${hj.version}.json (${deployment.environment} / ${deployment.module})`);
} else {
	const description = option('description');
	if (!description) fail('--description "<what this release is for>" is required for a new release');
	const previous = loadReleases().filter((r) => r.version !== hj.version && compareVersions(r.version, hj.version) < 0);
	const before = previous.length ? previous[previous.length - 1] : null;
	const record = {
		version: hj.version,
		built: hj.built,
		description,
		sourceCommit: fromCommit ? git('rev-parse', `${fromCommit}^`).trim() : git('rev-parse', 'HEAD').trim(),
		previousVersion: before ? before.version : null,
		files,
		components,
		contractChanges: contractChanges(before ? before.components : null, components),
		deployments: deployment ? [deployment] : [],
	};
	save(record);
	const breaking = record.contractChanges.filter((c) => c.breaking);
	console.log(
		`release-record: wrote releases/${hj.version}.json (${components.length} component${components.length === 1 ? '' : 's'}, ${record.contractChanges.length} contract change${record.contractChanges.length === 1 ? '' : 's'}${breaking.length ? `, ${breaking.length} BREAKING` : ''})`,
	);
	for (const c of breaking) console.log(`  breaking: ${c.component}: ${c.change}`);
}
writePage();
console.log('release-record: wrote docs/Releases.md');
