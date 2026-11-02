// Writes every component's and template's README.md from its component.json
// (scripts/lib/component-docs.mjs). check-contracts fails when one is stale.
//
// Usage (from the repo root): npm run docs:components
import { writeFileSync } from 'node:fs';
import { relative } from 'node:path';
import { readmes } from './lib/component-docs.mjs';
import { root } from './lib/contract.mjs';

let written = 0;
for (const r of readmes()) {
	if (r.actual === r.expected) continue;
	writeFileSync(r.path, r.expected);
	written += 1;
	console.log(`component-docs: wrote ${relative(root, r.path).split('\\').join('/')}`);
}
if (!written) console.log('component-docs: every component README is up to date');
