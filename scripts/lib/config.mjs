// The project's settings, factory.config.json at the repo root: everything that
// differs between projects made from this blueprint. The build, the checks, the
// generators and the scaffold read it instead of hardcoding names.
//
//   project       the project's name: the README title and the combined files' header
//   namespace     the global every component registers on (window.<namespace>.<Class>)
//   outsystemsUi  the OutSystems UI version the target environment runs; the
//                 outsystems-ui package must be pinned to it (package.json)
//   o11.script    the Script that holds dist/components.js
//   o11.theme     the theme whose stylesheet holds dist/components.css
//   o11.flow      the UI flow new Blocks and harness screens go in
//   o11.layout    the layout block harness screens use
//   o11.harnessRole  the role harness screens are for
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', '..');
export const configPath = join(root, 'factory.config.json');

const PASCAL = /^[A-Z][A-Za-z0-9]*$/;
const NAME = /^[A-Za-z][A-Za-z0-9_]*$/;

export function validateConfig(c) {
	const errors = [];
	const err = (m) => errors.push(`factory.config.json: ${m}`);
	if (!/^[A-Za-z][A-Za-z0-9 _-]*$/.test(c.project || '')) err('"project" must be a name (letters, digits, spaces, - and _)');
	if (!PASCAL.test(c.namespace || '')) err('"namespace" must be PascalCase, e.g. MyCompany');
	if (!/^\d+\.\d+\.\d+$/.test(c.outsystemsUi || '')) err('"outsystemsUi" must be a version, e.g. 2.30.0');
	const o = c.o11 || {};
	for (const key of ['script', 'theme', 'flow', 'layout', 'harnessRole']) if (!NAME.test(o[key] || '')) err(`"o11.${key}" must be an OutSystems element name`);
	return errors;
}

export function loadConfig() {
	let c;
	try {
		c = JSON.parse(readFileSync(configPath, 'utf8'));
	} catch (e) {
		throw new Error(`factory.config.json: ${e.message}`, { cause: e });
	}
	const errors = validateConfig(c);
	if (errors.length) throw new Error(errors.join('\n'));
	return c;
}
