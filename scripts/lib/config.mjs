// The project's settings, factory.config.json at the repo root: everything that
// differs between projects made from this blueprint. The build, the checks, the
// generators and the scaffold read it instead of hardcoding names.
//
// factory.config.local.json (ignored by git; copy factory.config.local.example.json) holds
// the names of your own environment. It can only override "o11" and "traditional", so
// the committed settings alone decide what a build produces, and your module names stay
// out of the repo.
//
//   project       the project's name: the README title and the combined files' header
//   namespace     the global every component registers on (window.<namespace>.<Class>)
//   outsystemsUi  the OutSystems UI version the target environment runs; the
//                 outsystems-ui package must be pinned to it (package.json)
//   o11.script    the Script that holds dist/components.js
//   o11.theme     the theme whose stylesheet holds dist/components.css
//   o11.flow      the UI flow harness screens go in (with the app's screens)
//   o11.blockFlow the UI flow the component Blocks go in, apart from the screens
//   o11.layout    the layout block harness screens use
//   o11.harnessRole  the role harness screens are for
//   o11.layoutFlow, o11.titlePlaceholder, o11.contentPlaceholder  optional, where the
//                 layout block is and its placeholders' names, for templates that differ
//                 (default Layouts, Title, MainContent)
//   traditional  optional: the same release in a Traditional Web module
//                (o11:generate -- <command> --traditional):
//     theme        the Web theme whose stylesheet holds dist/components.css
//     flow         the UI flow showcase screens go in
//     blockFlow    the UI flow the component Blocks go in
//     scriptBlock  the Web Block whose JavaScript holds dist/components.js; every
//                  component Block contains an instance of it, which loads the bundle
//                  (Traditional Web Blocks have no Required Scripts)
//     layout       { block, module, flow }: the layout Web Block screens use, and the
//                  referenced module and flow it comes from
//     layoutFill   { <placeholder>: <Web Block> }: blocks of this module the layout's
//                  placeholders get on every screen (a menu, an application title)
//     harnessRole  the role showcase screens are for
//     titlePlaceholder, contentPlaceholder  optional, as in o11 (default Title, MainContent)
//     feedbackModule  optional, the module with the Feedback_Message action (default RichWidgets)
//   budgets      optional size limits for the release, in KB: releaseJsKB
//                (dist/components.js) and releaseCssKB (dist/components.css);
//                npm run build:all fails over them
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', '..');
export const configPath = join(root, 'factory.config.json');
export const localConfigPath = join(root, 'factory.config.local.json');

const PASCAL = /^[A-Z][A-Za-z0-9]*$/;
const NAME = /^[A-Za-z][A-Za-z0-9_]*$/;

export function validateConfig(c) {
	const errors = [];
	const err = (m) => errors.push(`factory.config.json: ${m}`);
	if (!/^[A-Za-z][A-Za-z0-9 _-]*$/.test(c.project || '')) err('"project" must be a name (letters, digits, spaces, - and _)');
	if (!PASCAL.test(c.namespace || '')) err('"namespace" must be PascalCase, e.g. MyCompany');
	if (!/^\d+\.\d+\.\d+$/.test(c.outsystemsUi || '')) err('"outsystemsUi" must be a version, e.g. 2.30.0');
	const o = c.o11 || {};
	for (const key of ['script', 'theme', 'flow', 'blockFlow', 'layout', 'harnessRole']) if (!NAME.test(o[key] || '')) err(`"o11.${key}" must be an OutSystems element name`);
	for (const key of ['layoutFlow', 'titlePlaceholder', 'contentPlaceholder']) if (o[key] !== undefined && !NAME.test(o[key])) err(`"o11.${key}" must be an OutSystems element name`);
	if (c.traditional !== undefined) {
		const t = c.traditional;
		for (const key of ['theme', 'flow', 'blockFlow', 'scriptBlock', 'harnessRole']) if (!NAME.test(t[key] || '')) err(`"traditional.${key}" must be an OutSystems element name`);
		for (const key of ['titlePlaceholder', 'contentPlaceholder', 'feedbackModule']) if (t[key] !== undefined && !NAME.test(t[key])) err(`"traditional.${key}" must be an OutSystems element name`);
		for (const key of ['block', 'module', 'flow']) if (!NAME.test((t.layout || {})[key] || '')) err(`"traditional.layout.${key}" must be an OutSystems element name`);
		for (const [ph, b] of Object.entries(t.layoutFill || {})) if (!NAME.test(ph) || !NAME.test(b)) err(`"traditional.layoutFill.${ph}" must map a placeholder to a Web Block name`);
	}
	for (const [key, value] of Object.entries(c.budgets || {})) {
		if (!['releaseJsKB', 'releaseCssKB'].includes(key)) err(`"budgets.${key}" isn't a budget; use releaseJsKB or releaseCssKB`);
		else if (typeof value !== 'number' || value <= 0) err(`"budgets.${key}" must be a size in KB, greater than 0`);
	}
	return errors;
}

export function loadConfig() {
	let c;
	try {
		c = JSON.parse(readFileSync(configPath, 'utf8'));
	} catch (e) {
		throw new Error(`factory.config.json: ${e.message}`, { cause: e });
	}
	if (existsSync(localConfigPath)) {
		let local;
		try {
			local = JSON.parse(readFileSync(localConfigPath, 'utf8'));
		} catch (e) {
			throw new Error(`factory.config.local.json: ${e.message}`, { cause: e });
		}
		for (const key of Object.keys(local)) {
			if (key !== 'o11' && key !== 'traditional') throw new Error(`factory.config.local.json: "${key}" can't be overridden; only "o11" and "traditional" can`);
			c[key] = { ...c[key], ...local[key] };
		}
	}
	const errors = validateConfig(c);
	if (errors.length) throw new Error(errors.join('\n'));
	return c;
}
