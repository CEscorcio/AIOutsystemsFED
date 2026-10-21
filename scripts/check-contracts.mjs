// Build rule: every component's contract (component.json) agrees with its code.
//   - component.json is valid (scripts/lib/contract.mjs)
//   - types.ts: <Class>Parameters has one property per input (camelCase,
//     matching type) and nothing else; <Class>Events has one optional
//     callback per event, with the event's parameters in order
//   - src/index.ts registers window.<namespace>.<class>
//   - dist/<Class>.css: the modifiers it styles are exactly the contract's
//   - across components: one namespace, no class registered twice
// Runs after the components are built (npm test, npm run build:all).
//
// Usage (from the repo root): node scripts/check-contracts.mjs
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { camel, componentsDir, listComponents, loadContract, TYPES } from './lib/contract.mjs';

const problems = [];
const folders = listComponents();
const missing = readdirSync(componentsDir).filter((f) => statSync(join(componentsDir, f)).isDirectory() && !folders.includes(f) && existsSync(join(componentsDir, f, 'package.json')));
for (const f of missing) problems.push(`${f}: no component.json (every component describes its Block there; see docs/NewComponent.md)`);

function sourceFiles(dir) {
	return readdirSync(dir).flatMap((f) => {
		const p = join(dir, f);
		return statSync(p).isDirectory() ? sourceFiles(p) : p.endsWith('.ts') ? [p] : [];
	});
}

// Finds an interface by name in the component's src/ and returns its members as
// { name, optional, type (text), params ([{ name, type }] for a callback) }.
function readInterface(folder, name) {
	for (const file of sourceFiles(join(componentsDir, folder, 'src'))) {
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

const namespaces = new Map();
const classes = new Map();
for (const folder of folders) {
	const { contract: c, errors } = loadContract(folder);
	problems.push(...errors);
	if (!c || errors.length) continue;
	const at = (m) => problems.push(`${folder}: ${m}`);
	namespaces.set(c.namespace, [...(namespaces.get(c.namespace) || []), folder]);
	if (classes.has(c.class)) at(`class ${c.class} is also used by ${classes.get(c.class)}`);
	classes.set(c.class, folder);

	// types.ts: parameters
	const params = readInterface(folder, `${c.class}Parameters`);
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

	// types.ts: events
	const events = readInterface(folder, `${c.class}Events`);
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

	// index.ts registers the class on the namespace
	const index = join(componentsDir, folder, 'src', 'index.ts');
	const indexText = existsSync(index) ? readFileSync(index, 'utf8') : '';
	if (!new RegExp(`\\.${c.namespace}\\.${c.class}\\s*=`).test(indexText)) at(`src/index.ts doesn't register window.${c.namespace}.${c.class}`);

	// dist/<Class>.css styles exactly the contract's modifiers
	const cssPath = join(componentsDir, folder, 'dist', `${c.class}.css`);
	if (!existsSync(cssPath)) at(`dist/${c.class}.css is missing; build the component first`);
	else {
		const css = readFileSync(cssPath, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
		const styled = [...new Set([...css.matchAll(new RegExp(`\\.(${c.block}--(?!is-)[a-z0-9]+(?:-[a-z0-9]+)*)`, 'g'))].map((m) => m[1]))];
		const listed = c.modifiers.map((m) => m.class);
		for (const s of styled) if (!listed.includes(s)) at(`the CSS styles ${s}, which isn't in component.json's modifiers`);
		for (const l of listed) if (!styled.includes(l)) at(`component.json lists ${l}, but the CSS doesn't style it`);
	}
}
if (namespaces.size > 1) problems.push(`components use different namespaces (${[...namespaces].map(([n, f]) => `${n}: ${f.join(', ')}`).join('; ')}); the factory registers every class on one`);

if (problems.length) {
	console.error(`check-contracts: ${problems.length} problem${problems.length === 1 ? '' : 's'}\n${problems.map((p) => `  - ${p}`).join('\n')}`);
	process.exit(1);
}
console.log(`check-contracts: ${folders.length === 1 ? 'the contract agrees' : `all ${folders.length} contracts agree`} with the code`);
