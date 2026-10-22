// Builds one component into the two files that ship:
//   dist/<Class>.js   src/index.ts bundled with the registration that puts the
//                     class on window.<namespace> (namespace from factory.config.json)
//   dist/<Class>.css  style/, compiled and joined (packages/toolchain/lib.mjs)
// The class name comes from the component's component.json.
//
// Usage: from a component's folder, npm run build (its package.json calls this).
import { mkdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadConfig } from '../../scripts/lib/config.mjs';
import { loadContract } from '../../scripts/lib/contract.mjs';
import { buildStyles, bundle, registrationEntry } from './lib.mjs';

export async function buildComponent(componentDir) {
	const dir = resolve(componentDir);
	const { contract, errors } = loadContract(basename(dir), dirname(dir));
	if (!contract || errors.length) throw new Error(`component.json: ${errors.join('; ')}`);
	const { namespace } = loadConfig();
	const js = await bundle(registrationEntry(namespace, [{ className: contract.class, importPath: './src/index.ts' }]), dir);
	// eslint-disable-next-line no-control-regex -- matching the whole ASCII range is intended
	if (/[^\x00-\x7F]/.test(js)) throw new Error(`dist/${contract.class}.js has a non-ASCII character; keep the source ASCII-only`);
	const { css, files } = await buildStyles(dir);
	mkdirSync(join(dir, 'dist'), { recursive: true });
	writeFileSync(join(dir, 'dist', `${contract.class}.js`), js);
	writeFileSync(join(dir, 'dist', `${contract.class}.css`), css);
	return { contract, namespace, files };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
	try {
		const { contract, namespace, files } = await buildComponent(process.cwd());
		console.log(`  dist/${contract.class}.js   window.${namespace}.${contract.class}`);
		console.log(`  dist/${contract.class}.css  from style/${files.join(', style/')}`);
	} catch (e) {
		console.error(`build: ${e.message}`);
		process.exit(1);
	}
}
