// Runs test/checks.js against the built bundle in jsdom, with the built
// stylesheet's text and the base theme's tokens for the CSS checks.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

const require = createRequire(import.meta.url);
const runGreetingCardChecks = require('./checks.js');

// The base theme: OutSystems UI's O11 stylesheet from the installed package
// (pinned at the repo root to the version the O11 environment runs).
const osuiCssPath = join(dirname(require.resolve('outsystems-ui/package.json')), 'dist', 'O11.OutSystemsUI.css');
const osuiCss = readFileSync(osuiCssPath, 'utf8');
const osuiTokens = {};
for (const block of osuiCss.matchAll(/(?:^|[},\s]):root\s*\{([^}]*)\}/g)) {
	for (const m of block[1].matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);?/g)) {
		if (!(m[1] in osuiTokens)) osuiTokens[m[1]] = m[2].trim();
	}
}
if (Object.keys(osuiTokens).length === 0) throw new Error(`no :root variables found in ${osuiCssPath}`);

const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
	runScripts: 'outside-only',
});
dom.window.eval(readFileSync(new URL('../dist/GreetingCard.js', import.meta.url), 'utf8'));

const css = readFileSync(new URL('../dist/GreetingCard.css', import.meta.url), 'utf8');
const results = runGreetingCardChecks(dom.window, css, osuiTokens);
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}`);
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
