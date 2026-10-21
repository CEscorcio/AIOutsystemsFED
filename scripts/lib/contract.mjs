// Loads and validates a component's contract (components/<name>/component.json),
// the single description of its OutSystems Block that the checks, the
// generators (platform/o11/) and the release records all read.
//
// component.json:
//   class        PascalCase class name, registered as window.<namespace>.<class>
//   block        the BEM block, kebab-case of class (Style.md, Rule 0)
//   namespace    the global the bundle registers on
//   description  one sentence, shown in the docs and the Block's description
//   inputs       Block Input Parameters, in order: name (PascalCase), type,
//                mandatory, default (an OutSystems expression), description,
//                example (an expression the harness uses)
//   events       Block Events: name (On...), description, params [{ name, type, description }]
//   modifiers    BEM modifiers accepted through ExtendedClass: [{ class, description }]
//
// ExtendedClass is not listed: every Block gets it (Text, not mandatory,
// default ""), applied by the Block's main container and never passed to
// the class (Components.md, step 2).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const root = join(import.meta.dirname, '..', '..');
export const componentsDir = join(root, 'components');

// OutSystems basic types a contract may use, with their TypeScript and Model API forms.
export const TYPES = {
	Text: { ts: 'string', modelApi: 'eSpace.TextType' },
	Integer: { ts: 'number', modelApi: 'eSpace.IntegerType' },
	Decimal: { ts: 'number', modelApi: 'eSpace.DecimalType' },
	Boolean: { ts: 'boolean', modelApi: 'eSpace.BooleanType' },
};

export const kebab = (pascal) => pascal.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
export const camel = (pascal) => pascal.charAt(0).toLowerCase() + pascal.slice(1);
// OnGreetClicked -> TriggerGreetClicked: the Client Action a JS node can call ($actions lists Client Actions, not Block Events).
export const bridgeAction = (eventName) => `Trigger${eventName.replace(/^On/, '')}`;

const PASCAL = /^[A-Z][A-Za-z0-9]*$/;

export function listComponents() {
	return (existsSync(componentsDir) ? readdirSync(componentsDir) : []).filter((name) => existsSync(join(componentsDir, name, 'component.json'))).sort();
}

// Returns { contract, errors }. errors is empty when the contract is valid.
export function loadContract(folder) {
	const path = join(componentsDir, folder, 'component.json');
	const errors = [];
	let c;
	try {
		c = JSON.parse(readFileSync(path, 'utf8'));
	} catch (e) {
		return { contract: null, errors: [`${folder}/component.json: ${e.message}`] };
	}
	const err = (m) => errors.push(`${folder}/component.json: ${m}`);
	if (!PASCAL.test(c.class || '')) err('"class" must be PascalCase');
	if (c.block !== kebab(c.class || '')) err(`"block" must be "${kebab(c.class || '')}", the kebab-case of "class"`);
	if (c.block !== folder) err(`"block" must match the folder name "${folder}"`);
	if (!PASCAL.test(c.namespace || '')) err('"namespace" must be PascalCase');
	if (!c.description) err('"description" is missing');
	const names = new Set();
	for (const [i, p] of (c.inputs || []).entries()) {
		const at = `inputs[${i}]`;
		if (!PASCAL.test(p.name || '')) err(`${at}.name must be PascalCase`);
		if (p.name === 'ExtendedClass') err(`${at}: ExtendedClass is added to every Block; don't list it`);
		if (names.has(p.name)) err(`${at}: "${p.name}" is listed twice`);
		names.add(p.name);
		if (!TYPES[p.type]) err(`${at}.type must be one of ${Object.keys(TYPES).join(', ')}`);
		if (typeof p.mandatory !== 'boolean') err(`${at}.mandatory must be true or false`);
		if (typeof p.default !== 'string') err(`${at}.default must be an OutSystems expression, e.g. "\\"\\"" or "0"`);
		if (!p.description) err(`${at}.description is missing`);
	}
	for (const [i, e] of (c.events || []).entries()) {
		const at = `events[${i}]`;
		if (!/^On[A-Z][A-Za-z0-9]*$/.test(e.name || '')) err(`${at}.name must start with "On", e.g. OnClick`);
		if (!e.description) err(`${at}.description is missing`);
		for (const [j, p] of (e.params || []).entries()) {
			if (!PASCAL.test(p.name || '')) err(`${at}.params[${j}].name must be PascalCase`);
			if (!TYPES[p.type]) err(`${at}.params[${j}].type must be one of ${Object.keys(TYPES).join(', ')}`);
		}
	}
	for (const [i, m] of (c.modifiers || []).entries()) {
		if (!new RegExp(`^${c.block}--[a-z0-9]+(-[a-z0-9]+)*$`).test(m.class || '')) err(`modifiers[${i}].class must be ${c.block}--<modifier>`);
		if ((m.class || '').includes('--is-')) err(`modifiers[${i}]: --is-* is a state the component sets, not a modifier`);
		if (!m.description) err(`modifiers[${i}].description is missing`);
	}
	return { contract: { inputs: [], events: [], modifiers: [], ...c, folder }, errors };
}
