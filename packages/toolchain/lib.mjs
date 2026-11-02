// The toolchain's shared pieces: building a component's JS and CSS, and the
// registration code that puts a class on window.<namespace>. Used by build.mjs
// (one component) and scripts/build-all.mjs (the release bundle).
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { build } from 'esbuild';
import { format, resolveConfig } from 'prettier';
import { compile } from 'sass';

// esbuild settings shared by component builds and the release bundle: one IIFE,
// ES2019, not minified, so the Script OutSystems serves can be diffed with dist/.
export const ESBUILD = { bundle: true, format: 'iife', target: 'es2019', minify: false, charset: 'utf8', legalComments: 'none', write: false, logLevel: 'silent' };

// The entry module that registers classes on window.<namespace>. The namespace
// comes from factory.config.json only; component code just exports its class.
// release, when given, is set as window.<namespace>.__release, so the browser
// console says which release a page runs.
export function registrationEntry(namespace, entries, release) {
	const lines = entries.map((e, i) => `import { ${e.className} as C${i} } from ${JSON.stringify(e.importPath)};`);
	lines.push('var w = window;', `var ns = (w[${JSON.stringify(namespace)}] = w[${JSON.stringify(namespace)}] || {});`);
	entries.forEach((e, i) => lines.push(`ns.${e.className} = C${i};`));
	lines.push(release ? `ns.__release = ${JSON.stringify(release)};` : 'if (!ns.__release) ns.__release = "dev";');
	return lines.join('\n');
}

// Bundles an entry (given as source text) into one IIFE; returns its text. The
// file starts with "use strict", as a TypeScript entry's bundle did; the release
// bundle (build-all) declares it once at the top instead.
export async function bundle(contents, resolveDir, { strict = true } = {}) {
	const result = await build({ ...ESBUILD, ...(strict ? { banner: { js: '"use strict";' } } : {}), stdin: { contents, resolveDir, sourcefile: 'factory-entry.js', loader: 'js' } });
	return result.outputFiles[0].text;
}

// Every .scss and .css file in a component's style/, alphabetical, as one
// stylesheet. SCSS is compiled with Dart Sass, then formatted with the repo's
// Prettier config so dist/ reads like hand-written CSS. Partials (_name.scss)
// are only included through @use.
export async function buildStyles(componentDir) {
	const styleDir = join(componentDir, 'style');
	const files = readdirSync(styleDir)
		.filter((f) => /\.s?css$/.test(f) && !f.startsWith('_'))
		.sort();
	if (files.length === 0) throw new Error(`${styleDir} has no .scss or .css file`);
	const prettierConfig = { ...(await resolveConfig(join(styleDir, 'x.css'))), parser: 'css' };
	const parts = [];
	for (const f of files) {
		const path = join(styleDir, f);
		const text = f.endsWith('.scss') ? await format(compile(path, { style: 'expanded', sourceMap: false }).css.replace(/\}\n(?!\s*\})/g, '}\n\n'), prettierConfig) : readFileSync(path, 'utf8');
		parts.push(text.replace(/\r\n/g, '\n').trim());
	}
	return { css: `${parts.join('\n\n')}\n`, files };
}
