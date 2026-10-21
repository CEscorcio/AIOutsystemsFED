// Builds the two files that go to OutSystems:
//   dist/GreetingCard.js   src/ bundled into one Script (IIFE + ES2019 + not
//                          minified, so the published copy can be diffed)
//   dist/GreetingCard.css  every .scss and .css file in style/, in alphabetical
//                          order, shipped as a stylesheet of its own. SCSS is
//                          compiled with Dart Sass, then formatted with
//                          Prettier; partials (_name.scss) are only included
//                          through @use.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { build } from 'esbuild';
import { format, resolveConfig } from 'prettier';
import { compile } from 'sass';

await build({
	entryPoints: ['src/index.ts'],
	outfile: 'dist/GreetingCard.js',
	bundle: true,
	format: 'iife',
	target: 'es2019',
	minify: false,
	charset: 'utf8',
	legalComments: 'none',
	logLevel: 'info',
});

const styleFiles = readdirSync('style')
	.filter((f) => /\.s?css$/.test(f) && !f.startsWith('_'))
	.sort();
if (styleFiles.length === 0) throw new Error('build: style/ has no .scss or .css file');
// Compiled SCSS goes through the repo's Prettier config, so dist/ reads like
// hand-written CSS (tabs, single quotes, a blank line between rules).
const prettierConfig = { ...(await resolveConfig('style/greeting-card.css')), parser: 'css' };
const parts = [];
for (const f of styleFiles) {
	const compiled = () => compile(`style/${f}`, { style: 'expanded', sourceMap: false }).css.replace(/\}\n(?!\s*\})/g, '}\n\n');
	const text = f.endsWith('.scss') ? await format(compiled(), prettierConfig) : readFileSync(`style/${f}`, 'utf8');
	parts.push(text.replace(/\r\n/g, '\n').trim());
}
const css = parts.join('\n\n');
writeFileSync('dist/GreetingCard.css', `${css}\n`);
console.log(`\n  dist/GreetingCard.css  from style/${styleFiles.join(', style/')}`);
