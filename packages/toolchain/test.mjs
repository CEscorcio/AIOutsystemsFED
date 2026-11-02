// Tests one component: typecheck, build, then every check in jsdom.
//   1. tsc --noEmit with the toolchain's TypeScript, on the component's tsconfig.json
//   2. the build (build.mjs): dist/<Class>.js and dist/<Class>.css
//   3. in a jsdom page, like the preview: the built bundle, then
//      structural-checks.js (the rules every component passes) and the
//      component's test/checks.js (its behaviour), with the built stylesheet's
//      text and the base theme's tokens from the installed outsystems-ui package
//
// Usage: from a component's folder, npm test (its package.json calls this).
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';
import { buildComponent } from './build.mjs';

const require = createRequire(import.meta.url);
const dir = process.cwd();
const fail = (message) => {
	console.error(`test: ${message}`);
	process.exit(1);
};

// 1. Typecheck with this toolchain's TypeScript (the root keeps an older one for ESLint).
const tsc = join(dirname(require.resolve('typescript/package.json')), 'bin', 'tsc');
try {
	execFileSync(process.execPath, [tsc, '-p', join(dir, 'tsconfig.json')], { stdio: 'inherit' });
} catch {
	fail('the typecheck failed');
}

// 2. Build.
let built;
try {
	built = await buildComponent(dir);
} catch (e) {
	fail(e.message);
}
const { contract, namespace } = built;

// 3. Checks, in a page like the preview.
const osuiCssPath = join(dirname(require.resolve('outsystems-ui/package.json', { paths: [dir] })), 'dist', 'O11.OutSystemsUI.css');
const osuiTokens = {};
for (const block of readFileSync(osuiCssPath, 'utf8').matchAll(/(?:^|[},\s]):root\s*\{([^}]*)\}/g)) {
	for (const m of block[1].matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);?/g)) if (!(m[1] in osuiTokens)) osuiTokens[m[1]] = m[2].trim();
}
if (Object.keys(osuiTokens).length === 0) fail(`no :root variables found in ${osuiCssPath}`);

const { window } = new JSDOM('<!doctype html><html><head></head><body></body></html>', { runScripts: 'outside-only' });
window.eval(readFileSync(join(dir, 'dist', `${contract.class}.js`), 'utf8'));
window.eval(readFileSync(new URL('./structural-checks.js', import.meta.url), 'utf8'));
window.eval(readFileSync(join(dir, 'test', 'checks.js'), 'utf8'));
if (typeof window.componentTest !== 'object') fail('test/checks.js must define var componentTest = { block, osuiClasses, config, behaviour }');
if (window.componentTest.block !== contract.block) fail(`test/checks.js says block "${window.componentTest.block}"; component.json says "${contract.block}"`);

const Ctor = (window[namespace] || {})[contract.class];
const css = readFileSync(join(dir, 'dist', `${contract.class}.css`), 'utf8');
const results = window.runComponentChecks(window, Ctor, window.componentTest, { label: `window.${namespace}.${contract.class}`, css, osuiTokens });
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}`);
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
