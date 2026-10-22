// Renders a component's README.md from its component.json: the page an
// OutSystems developer reads to use the Block (inputs, events, modifiers), and a
// front-end developer reads to find their way around the folder. Written by
// scripts/component-docs.mjs; check-contracts fails when one is missing or stale.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig } from './config.mjs';
import { bridgeAction, camel, componentsDir, listComponents, loadContract, templatesDir } from './contract.mjs';

const cell = (text) =>
	String(text ?? '')
		.replace(/\\/g, '\\\\')
		.replace(/\|/g, '\\|')
		.replace(/\r?\n/g, ' ');
const code = (text) => `\`${String(text).replace(/`/g, "'")}\``;

// Only names from the contract and the project's namespace, and relative links:
// a README copied by the scaffold and renamed must equal the one generated for
// the copy. npm run init regenerates every README when it sets a new namespace.
export function renderReadme(c, namespace = loadConfig().namespace) {
	const out = [
		`# ${c.class}`,
		'',
		cell(c.description),
		'',
		'> Generated from `component.json` by `npm run docs:components`. Change the contract and regenerate; `npm test` fails when this page is stale.',
		'',
		'## Using the Block in OutSystems',
		'',
		`The Block is named \`${c.class}\`. Generate it with \`npm run o11:generate -- block ${c.block}\`, and a test screen with \`npm run o11:generate -- harness ${c.block}\` ([Components_11.md](../../docs/guide/Components_11.md#generated-lambdas)). It runs the class from the release's Script, and is styled by the components section of the app's theme stylesheet; both come from the same release (\`npm run build:all\`).`,
		'',
		'### Input parameters',
		'',
		'| Name | Type | Mandatory | Default | Description |',
		'|---|---|---|---|---|',
		...c.inputs.map((p) => `| \`${p.name}\` | ${p.type} | ${p.mandatory ? 'Yes' : 'No'} | ${code(p.default)} | ${cell(p.description)} |`),
		`| \`ExtendedClass\` | Text | No | ${code('""')} | Extra classes for the Block's main container, such as a modifier below. Applied by the Block; never reaches the class. |`,
		'',
		'### Events',
		'',
	];
	if (c.events.length) {
		out.push('| Event | Parameters | Description |', '|---|---|---|');
		for (const e of c.events) {
			const params = (e.params || []).map((p) => `\`${p.name}\` (${p.type})${p.description ? `: ${cell(p.description)}` : ''}`).join('<br>') || 'none';
			out.push(`| \`${e.name}\` | ${params} | ${cell(e.description)} Raised through the Block's \`${bridgeAction(e.name)}\` client action. |`);
		}
	} else out.push('None.');
	out.push('', '### Modifiers', '');
	if (c.modifiers.length) {
		out.push('Set through `ExtendedClass`, for example `ExtendedClass = "' + c.modifiers[0].class + '"`.', '', '| Class | Effect |', '|---|---|');
		for (const m of c.modifiers) out.push(`| \`${m.class}\` | ${cell(m.description)} |`);
	} else out.push('None.');
	out.push(
		'',
		'## In the browser',
		'',
		`The release's Script registers \`window.${namespace}.${c.class}\`. The Block drives it from three lifecycle handlers:`,
		'',
		`- **OnReady**: \`new ${namespace}.${c.class}({ runtimeId, ${[...c.inputs.map((p) => camel(p.name)), ...(c.events.length ? ['events'] : [])].join(', ')} })\`, mounted in the Block's \`MountPoint\` container`,
		`- **OnParametersChanged**: \`instance.onParametersChanged({ ${c.inputs.map((p) => camel(p.name)).join(', ')} })\``,
		'- **OnDestroy**: `instance.destroy()`',
		'',
		'## Files',
		'',
		'| File | What it is |',
		'|---|---|',
		'| [component.json](component.json) | The contract this page is generated from |',
		'| [src/](src/) | The class, its TypeScript contract (`types.ts`) and its registration (`index.ts`) |',
		`| [style/](style/) | The styles (SCSS), BEM block \`${c.block}\` ([Style.md](../../docs/guide/Style.md)) |`,
		'| [test/checks.js](test/checks.js) | The checks `npm test` runs |',
		'| [preview/index.html](preview/index.html) | A local preview with the real OutSystems UI stylesheet; add `?test=1` to run the checks |',
		'| `dist/` | The built JS and CSS, written by `npm test`; never edited |',
	);
	return `${out.join('\n')}\n`;
}

// Every component and template with its README: { path, expected, actual }.
export function readmes() {
	const all = [];
	for (const dir of [componentsDir, templatesDir]) {
		for (const folder of listComponents(dir)) {
			const { contract, errors } = loadContract(folder, dir);
			if (!contract || errors.length) continue;
			const path = join(dir, folder, 'README.md');
			all.push({ path, contract, expected: renderReadme(contract), actual: existsSync(path) ? readFileSync(path, 'utf8').replace(/\r\n/g, '\n') : null });
		}
	}
	return all;
}
