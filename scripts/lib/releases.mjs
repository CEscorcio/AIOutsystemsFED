// Release records: releases/<version>.json, one per committed release, and the
// page generated from them, docs/project/Releases.md. A record holds what the release
// contains (files and per-component sections, with hashes, and each
// component's contract), a description written by a person, the contract
// changes since the previous release, and every deployment of it.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { root } from './contract.mjs';

export const releasesDir = join(root, 'releases');
export const releasesPage = join(root, 'docs', 'project', 'Releases.md');

export const compareVersions = (a, b) => {
	const pa = a.split('.').map(Number);
	const pb = b.split('.').map(Number);
	for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i];
	return 0;
};

export function loadReleases() {
	if (!existsSync(releasesDir)) return [];
	return readdirSync(releasesDir)
		.filter((f) => /^\d+\.\d+\.\d+\.json$/.test(f))
		.map((f) => JSON.parse(readFileSync(join(releasesDir, f), 'utf8')))
		.sort((a, b) => compareVersions(a.version, b.version));
}

// The part of a contract that a screen depends on: names, types, mandatory.
export function contractSnapshot(c) {
	return {
		inputs: c.inputs.map((p) => ({ name: p.name, type: p.type, mandatory: p.mandatory })),
		events: c.events.map((e) => ({ name: e.name, params: (e.params || []).map((p) => ({ name: p.name, type: p.type })) })),
		modifiers: c.modifiers.map((m) => m.class),
	};
}

// What changed for screens between two releases' components. A change is
// breaking when a screen that uses the Block can stop compiling or lose a
// style: something removed, a type changed, a new mandatory input, an input
// that became mandatory, or an event's parameters changed.
export function contractChanges(previous, current) {
	const changes = [];
	const add = (component, change, breaking) => changes.push({ component, change, breaking });
	const before = new Map((previous || []).map((c) => [c.folder, c]));
	const after = new Map(current.map((c) => [c.folder, c]));
	for (const [folder, c] of after) {
		const p = before.get(folder);
		if (!p) {
			add(folder, 'component added', false);
			continue;
		}
		if (!p.contract || !c.contract) continue;
		const pi = new Map(p.contract.inputs.map((x) => [x.name, x]));
		for (const i of c.contract.inputs) {
			const old = pi.get(i.name);
			if (!old) add(folder, `input ${i.name} added${i.mandatory ? ' (mandatory)' : ''}`, i.mandatory);
			else {
				if (old.type !== i.type) add(folder, `input ${i.name}: ${old.type} -> ${i.type}`, true);
				if (!old.mandatory && i.mandatory) add(folder, `input ${i.name} is now mandatory`, true);
				if (old.mandatory && !i.mandatory) add(folder, `input ${i.name} is no longer mandatory`, false);
			}
		}
		for (const old of p.contract.inputs) if (!c.contract.inputs.some((i) => i.name === old.name)) add(folder, `input ${old.name} removed`, true);
		const pe = new Map(p.contract.events.map((x) => [x.name, x]));
		for (const e of c.contract.events) {
			const old = pe.get(e.name);
			const sig = (ev) => ev.params.map((x) => `${x.name}: ${x.type}`).join(', ');
			if (!old) add(folder, `event ${e.name} added`, false);
			else if (sig(old) !== sig(e)) add(folder, `event ${e.name}: (${sig(old)}) -> (${sig(e)})`, true);
		}
		for (const old of p.contract.events) if (!c.contract.events.some((e) => e.name === old.name)) add(folder, `event ${old.name} removed`, true);
		for (const m of c.contract.modifiers) if (!p.contract.modifiers.includes(m)) add(folder, `modifier ${m} added`, false);
		for (const m of p.contract.modifiers) if (!c.contract.modifiers.includes(m)) add(folder, `modifier ${m} removed`, true);
	}
	for (const folder of before.keys()) if (!after.has(folder)) add(folder, 'component removed', true);
	return changes;
}

const short = (sha) => (sha ? sha.slice(0, 12) : '');
const cell = (text) => String(text).replace(/\|/g, '\\|').replace(/\n/g, ' ');

export function renderPage(releases) {
	const newest = [...releases].reverse();
	const out = [
		'# Releases',
		'',
		'Every committed release of `dist/components.js` and `dist/components.css`, newest first: what it contains, where it was deployed and how that was checked.',
		'',
		'> Generated from `releases/<version>.json` by `scripts/release-record.mjs`. Don\'t edit this page; record a release or a deployment with `npm run release:record` (see the README, "Releasing").',
		'',
		'| Version | Built | Components | Deployed to | Breaking changes |',
		'|---|---|---|---|---|',
		...newest.map((r) => {
			const deployed = r.deployments.length ? r.deployments.map((d) => `${d.environment} / ${d.module}`).join(', ') : 'not recorded';
			const breaking = r.contractChanges.filter((c) => c.breaking).length;
			return `| [${r.version}](#${r.version.replace(/\./g, '')}) | ${r.built.slice(0, 10)} | ${r.components.map((c) => c.folder).join(', ')} | ${cell(deployed)} | ${breaking || 'none'} |`;
		}),
		'',
	];
	for (const r of newest) {
		out.push(`## ${r.version}`, '', cell(r.description), '');
		out.push(`- **Built:** ${r.built}`, `- **Source commit:** \`${short(r.sourceCommit)}\``);
		for (const [file, f] of Object.entries(r.files)) out.push(`- **${file}:** ${f.bytes} bytes, sha256 \`${short(f.sha256)}\``);
		out.push('', '| Component | Class | Inputs | Events | Modifiers |', '|---|---|---|---|---|');
		for (const c of r.components) {
			const k = c.contract;
			out.push(
				k
					? `| ${c.folder} | \`${c.namespace}.${c.class}\` | ${k.inputs.map((i) => `${i.name}: ${i.type}${i.mandatory ? '*' : ''}`).join(', ') || 'none'} | ${k.events.map((e) => `${e.name}(${e.params.map((p) => `${p.name}: ${p.type}`).join(', ')})`).join(', ') || 'none'} | ${k.modifiers.join(', ') || 'none'} |`
					: `| ${c.folder} | \`${c.namespace || '?'}.${c.class || '?'}\` | not recorded | not recorded | not recorded |`,
			);
		}
		out.push('', '\\* mandatory. Every Block also takes `ExtendedClass` (Text, optional).', '');
		out.push('**Contract changes since the previous release:**', '');
		if (r.contractChanges.length) out.push(...r.contractChanges.map((c) => `- ${c.breaking ? '**Breaking:** ' : ''}${c.component}: ${c.change}`));
		else out.push('- none');
		out.push('', '**Deployments:**', '');
		if (r.deployments.length) {
			out.push('| Platform | Environment | Module | Script | Theme | Published | Verified |', '|---|---|---|---|---|---|---|');
			for (const d of r.deployments)
				out.push(`| ${d.platform} | ${cell(d.environment)} | ${cell(d.module)} | ${cell(d.script || '')} | ${cell(d.theme || '')} | ${d.published || ''} | ${cell(d.verified || 'not recorded')} |`);
		} else out.push('- not recorded');
		out.push('');
	}
	return `${out.join('\n').trimEnd()}\n`;
}

export function writePage() {
	const text = renderPage(loadReleases());
	writeFileSync(releasesPage, text);
	return text;
}
