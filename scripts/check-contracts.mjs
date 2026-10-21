// Build rule: the project's settings are valid, and every component's contract
// (component.json) agrees with its code.
//   - factory.config.json is valid, and the outsystems-ui package is pinned to
//     its "outsystemsUi" version
//   - component.json is valid (scripts/lib/contract.mjs)
//   - types.ts: <Class>Parameters has one property per input (camelCase,
//     matching type) and nothing else; <Class>Events has one optional
//     callback per event, with the event's parameters in order
//   - src/index.ts registers window.<namespace>.<class>
//   - dist/<Class>.css: the modifiers it styles are exactly the contract's
//   - components (not templates) register on the config's namespace, and no
//     class is registered twice
// Templates (templates/*) are checked the same way, since new components are
// copied from them, but they don't ship and may use any namespace.
// Runs after the components are built (npm test, npm run build:all).
//
// Usage (from the repo root): node scripts/check-contracts.mjs
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { loadConfig } from './lib/config.mjs';
import { camel, componentsDir, listComponents, loadContract, root, templatesDir, TYPES } from './lib/contract.mjs';

const problems = [];

let config = null;
try {
	config = loadConfig();
} catch (e) {
	problems.push(e.message);
}
if (config) {
	const pinned = (JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).devDependencies || {})['outsystems-ui'];
	if (pinned !== config.outsystemsUi)
		problems.push(`package.json pins outsystems-ui to ${pinned}, but factory.config.json says ${config.outsystemsUi}: run npm install -D --save-exact outsystems-ui@${config.outsystemsUi}`);
}

function sourceFiles(dir) {
	return readdirSync(dir).flatMap((f) => {
		const p = join(dir, f);
		return statSync(p).isDirectory() ? sourceFiles(p) : p.endsWith('.ts') ? [p] : [];
	});
}

// Finds an interface by name in a component's src/ and returns its members as
// { name, optional, type (text), params ([{ name, type }] for a callback) }.
function readInterface(src, name) {
	for (const file of sourceFiles(src)) {
		const sf = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.ES2019, true);
		const found = sf.statements.find((s) => ts.isInterfaceDeclaration(s) && s.name.text === name);
		if (!found) continue;
		return found.members.filter(ts.isPropertySignature).map((m) => {
			const fn = m.type && ts.isFunctionTypeNode(m.type) ? m.type : null;
			return {
				name: m.name.getText(sf),
				optional: !!m.questionToken,
				type: m.type ? m.type.getText(sf) : '',
				params: fn ? fn.parameters.map((p) => ({ name: p.name.getText(sf), type: p.type ? p.type.getText(sf) : '' })) : null,
			};
		});
	}
	return null;
}

function checkOne(dir, folder, label) {
	const { contract: c, errors } = loadContract(folder, dir);
	problems.push(...errors.map((e) => `${label}${e}`));
	if (!c || errors.length) return null;
	const at = (m) => problems.push(`${label}${folder}: ${m}`);
	const base = join(dir, folder);

	const params = readInterface(join(base, 'src'), `${c.class}Parameters`);
	if (!params) at(`no interface ${c.class}Parameters in src/`);
	else {
		const expected = c.inputs.map((p) => ({ name: camel(p.name), type: TYPES[p.type].ts }));
		for (const e of expected) {
			const m = params.find((x) => x.name === e.name);
			if (!m) at(`${c.class}Parameters has no "${e.name}" (input ${e.name.charAt(0).toUpperCase() + e.name.slice(1)} in component.json)`);
			else if (m.type !== e.type) at(`${c.class}Parameters.${e.name} is ${m.type}; component.json says ${e.type}`);
		}
		for (const m of params) if (!expected.some((e) => e.name === m.name)) at(`${c.class}Parameters.${m.name} isn't an input in component.json`);
	}

	const events = readInterface(join(base, 'src'), `${c.class}Events`);
	if (!events) at(`no interface ${c.class}Events in src/`);
	else {
		for (const e of c.events) {
			const m = events.find((x) => x.name === e.name);
			if (!m) {
				at(`${c.class}Events has no "${e.name}"`);
				continue;
			}
			if (!m.optional) at(`${c.class}Events.${e.name} must be optional (a screen may not handle it)`);
			const want = (e.params || []).map((p) => TYPES[p.type].ts);
			const got = (m.params || []).map((p) => p.type);
			if (want.join(',') !== got.join(',')) at(`${c.class}Events.${e.name} takes (${got.join(', ')}); component.json says (${want.join(', ')})`);
		}
		for (const m of events) if (!c.events.some((e) => e.name === m.name)) at(`${c.class}Events.${m.name} isn't an event in component.json`);
	}

	const index = join(base, 'src', 'index.ts');
	const indexText = existsSync(index) ? readFileSync(index, 'utf8') : '';
	if (!new RegExp(`\\.${c.namespace}\\.${c.class}\\s*=`).test(indexText)) at(`src/index.ts doesn't register window.${c.namespace}.${c.class}`);

	const cssPath = join(base, 'dist', `${c.class}.css`);
	if (!existsSync(cssPath)) at(`dist/${c.class}.css is missing; build the component first`);
	else {
		const css = readFileSync(cssPath, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
		const styled = [...new Set([...css.matchAll(new RegExp(`\\.(${c.block}--(?!is-)[a-z0-9]+(?:-[a-z0-9]+)*)`, 'g'))].map((m) => m[1]))];
		const listed = c.modifiers.map((m) => m.class);
		for (const s of styled) if (!listed.includes(s)) at(`the CSS styles ${s}, which isn't in component.json's modifiers`);
		for (const l of listed) if (!styled.includes(l)) at(`component.json lists ${l}, but the CSS doesn't style it`);
	}
	return c;
}

const components = listComponents(componentsDir);
const templates = listComponents(templatesDir);
for (const [dir, list, label] of [
	[componentsDir, components, ''],
	[templatesDir, templates, 'templates/'],
]) {
	const missing = existsSync(dir) ? readdirSync(dir).filter((f) => statSync(join(dir, f)).isDirectory() && !list.includes(f) && existsSync(join(dir, f, 'package.json'))) : [];
	for (const f of missing) problems.push(`${label}${f}: no component.json (every component describes its Block there; see docs/guide/NewComponent.md)`);
}

const classes = new Map();
for (const folder of components) {
	const c = checkOne(componentsDir, folder, '');
	if (!c) continue;
	if (config && c.namespace !== config.namespace) problems.push(`${folder}: namespace is ${c.namespace}; factory.config.json says every component registers on ${config.namespace}`);
	if (classes.has(c.class)) problems.push(`${folder}: class ${c.class} is also used by ${classes.get(c.class)}`);
	classes.set(c.class, folder);
}
for (const folder of templates) checkOne(templatesDir, folder, 'templates/');

if (problems.length) {
	console.error(`check-contracts: ${problems.length} problem${problems.length === 1 ? '' : 's'}\n${problems.map((p) => `  - ${p}`).join('\n')}`);
	process.exit(1);
}
const n = components.length + templates.length;
console.log(
	`check-contracts: factory.config.json is valid; ${n === 1 ? 'the contract agrees' : `all ${n} contracts agree`} with the code (${components.length} component${components.length === 1 ? '' : 's'}, ${templates.length} template${templates.length === 1 ? '' : 's'})`,
);
