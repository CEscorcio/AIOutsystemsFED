// Checks what an OutSystems 11 Reactive app serves against dist/, after a publish
// (docs/guide/Components_11.md; AGENTS.md: a publish is confirmed only when the
// served files match). It only reads: it downloads the app's moduleinfo manifest
// and the files it lists, and changes nothing.
//
// Usage (from the repo root):
//   node platform/o11/verify.mjs --app https://<server>/<App> [<component> ...] [--keep <dir>]
//   or set O11_APP_URL instead of --app. Never commit the URL (AGENTS.md).
//
//   <component>  folders in components/ whose Block and <Class>Test screen to check;
//                default: every component
//   --keep       save the downloaded files in <dir>, to look at them afterwards
//
// What it checks, as measured in docs/guide/PlatformNotes.md:
//   the Script    identical to dist/components.js once the platform's BOM is removed
//   the theme     one components section, identical to dist/components.css once
//                 line endings are normalised
//   each Block    creates <namespace>.<Class>, updates and destroys it, wires its Trigger actions
//   each harness  the <Class>Test screen uses its Block
// Exit code 0 when every check passes, 1 otherwise.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig } from '../../scripts/lib/config.mjs';
import { bridgeAction, listComponents, loadContract, root } from '../../scripts/lib/contract.mjs';

const config = loadConfig();
const args = process.argv.slice(2);
const option = (name) => {
	const i = args.indexOf(`--${name}`);
	return i === -1 ? undefined : args[i + 1];
};
const positional = args.filter((a, i) => !a.startsWith('--') && !(args[i - 1] || '').startsWith('--'));

function fail(message) {
	console.error(`verify: ${message}`);
	process.exit(1);
}

const app = (option('app') || process.env.O11_APP_URL || '').replace(/\/+$/, '');
if (!/^https?:\/\/[^/]+\/[^/]+$/.test(app)) fail('pass the app as --app https://<server>/<App> (or set O11_APP_URL)');
const origin = new URL(app).origin;
const appName = new URL(app).pathname.slice(1);
const keep = option('keep');
if (keep) mkdirSync(keep, { recursive: true });

// Downloads time out: a stalled download once hung a check with no timeout.
async function get(path) {
	const res = await fetch(origin + path, { signal: AbortSignal.timeout(30000) });
	if (!res.ok) fail(`${path}: HTTP ${res.status}`);
	const text = await res.text();
	if (keep) writeFileSync(join(keep, path.split('/').pop().split('?')[0]), text);
	return text;
}

let failed = 0;
const check = (ok, message) => {
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${message}`);
	if (!ok) failed++;
};

// The manifest maps each served file to a version suffix; use the paths it lists.
const manifest = await get(`/${appName}/moduleservices/moduleinfo`);
const listed = new Map([...manifest.matchAll(/"(\/[^"]+\.(?:js|css))":"(\?[^"]*)"/g)].map((m) => [m[1], m[1] + m[2]]));
const served = async (path) => {
	const url = listed.get(`/${appName}/${path}`);
	if (!url) {
		check(false, `${path} is listed in moduleinfo`);
		return undefined;
	}
	return get(url);
};

const dist = (file) => readFileSync(join(root, 'dist', file), 'utf8');
const distJs = dist('components.js');
const distCss = dist('components.css');
const version = (distJs.match(/^ \* Version: (\S+)$/m) || [])[1];
console.log(`Checking ${appName} against dist/ ${version}`);

const js = await served(`scripts/${appName}.${config.o11.script}.js`);
if (js !== undefined) check(js.replace(/^\uFEFF/, '') === distJs, `Script ${config.o11.script} is identical to dist/components.js`);

const theme = await served(`css/${appName}.${config.o11.theme}.css`);
if (theme !== undefined) {
	const css = theme.replace(/\r+\n/g, '\n');
	const guard = '.components-start { }';
	const end = '/* ==== components: end ==== */';
	const sections = css.split(guard).length - 1;
	check(sections === 1, `theme ${config.o11.theme} has one components section (found ${sections})`);
	const section = css.slice(css.indexOf(guard), css.indexOf(end) + end.length);
	check(section.includes(distCss.replace(/\n+$/, '')), `its section contains dist/components.css (${version})`);
}

for (const folder of positional.length ? positional : listComponents()) {
	const { contract: c, errors } = loadContract(folder);
	if (!c) fail(errors.join('\n'));
	const block = await served(`scripts/${appName}.${config.o11.blockFlow}.${c.class}.mvc.js`);
	if (block !== undefined) {
		check(block.includes(`new ${config.namespace}.${c.class}(`), `${c.class}: creates ${config.namespace}.${c.class}`);
		check(block.includes('.onParametersChanged(') && block.includes('.destroy()'), `${c.class}: updates and destroys it`);
		for (const e of c.events) check(block.includes(bridgeAction(e.name)), `${c.class}: wires ${bridgeAction(e.name)}`);
	}
	const screen = await served(`scripts/${appName}.${config.o11.flow}.${c.class}Test.mvc.js`);
	if (screen !== undefined) check(screen.includes(`${config.o11.blockFlow}.${c.class}`), `${c.class}Test: uses the ${c.class} Block`);
}

console.log(failed ? `verify: ${failed} check(s) failed` : `verify: ${appName} serves dist/ ${version}`);
process.exit(failed ? 1 : 0);
