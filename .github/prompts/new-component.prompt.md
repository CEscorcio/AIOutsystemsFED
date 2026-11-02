---
name: 'new-component'
description: 'Create a new component from the template and make it the real thing, with npm test green.'
argument-hint: 'Component name in PascalCase, e.g. StatusBadge, plus what it does'
agent: 'agent'
---

Create the component ${input:name:Component name (PascalCase)}: ${input:description:What does it do?}

Follow [docs/guide/NewComponent.md](../../docs/guide/NewComponent.md) step by step; the detailed steps are also in [.claude/skills/new-pattern/SKILL.md](../../.claude/skills/new-pattern/SKILL.md). In short:

1. Scaffold it: `node .claude/skills/new-pattern/scaffold.mjs <Name>` (the namespace comes from `factory.config.json`), then `npm install` and `npm test -w components/<name>`. The copy must pass before you change anything.
2. Check nothing of the example is left: `GreetingCard`, `greeting-card` and `gc-test-mount` must not appear in the new folder.
3. Write the contract first: `component.json` and `types.ts` together (use `/design-contract` if it isn't agreed yet).
4. The class, then the SCSS (follow [Style.md](../../docs/guide/Style.md)), then the behaviour checks in `test/checks.js` (the structural checks are shared; don't copy them) and the preview page.
5. `npm test` at the repo root must pass, including `check-contracts`.

Don't build a release (`npm run build:all`) or touch OutSystems; say what's next instead ([Components_11.md](../../docs/guide/Components_11.md)).
