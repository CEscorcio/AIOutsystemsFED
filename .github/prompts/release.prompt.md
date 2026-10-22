---
name: 'release'
description: 'Prepare a release: build, generate the OutSystems lambdas, then record and commit it after it was uploaded and checked.'
argument-hint: 'What this release is for, e.g. "StatusBadge, first version"'
agent: 'agent'
---

Prepare a release: ${input:description:What is this release for?}

Follow the README's [Versioned Builds](../../README.md#versioned-builds) section:

1. `npm run build:all` (it runs every test first). Show the version and what `npm run release-notes` says it contains. Compare each component's `component.json` with the last record in `releases/`: removing an input, event or modifier, changing a type or adding a mandatory input is **breaking** for screens that use the Block, so say so before going on.
2. `npm run o11:generate -- script` and `npm run o11:generate -- theme`, plus `block` and `harness` for any new component. List the files and the values each probe must report.
3. **Stop here** unless Service Studio's MCP server is available and the user asks you to put it in OutSystems; then follow [the OutSystems instructions](../instructions/outsystems.instructions.md). Never publish without being asked.
4. Once it's uploaded and published, check it with `npm run o11:verify -- --app <the app's URL>` (ask the user for the URL; never write it into a file). Then: `npm run release:record -- --description "<description>" --environment <label> --module <Module> --verified "<what was checked>"`.
5. Commit `dist/components.js`, `dist/components.css` and `releases/` together, saying where it was uploaded. The pre-commit hook adds the CHANGELOG entry and the releases page. Don't commit a build that wasn't uploaded: it uses up a version number.
