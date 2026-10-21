---
name: 'Generated files'
description: 'Files the build, the release tooling or the generators write. Never edit them by hand.'
applyTo: '{components,templates}/*/README.md,dist/**,{components,templates}/*/dist/**,releases/**,docs/project/Releases.md,platform/o11/out/**,CHANGELOG.md'
---

# Generated files: don't edit

These files are written by tools, and some are checked by hash. Change their source and regenerate instead:

| File | Written by | Regenerate with |
|---|---|---|
| `dist/components.js`, `dist/components.css` | `scripts/build-all.mjs` | `npm run build:all` (commit only a build that was uploaded) |
| `components/*/dist/*`, `templates/*/dist/*` | each component's `build.mjs` | `npm test` |
| `releases/<version>.json` | `scripts/release-record.mjs` | `npm run release:record`; a record's files and hashes never change |
| `docs/project/Releases.md` | `scripts/lib/releases.mjs` | `npm run release:record -- --render` |
| `CHANGELOG.md` sections | the pre-commit hook (`scripts/release-notes.mjs`) | committing a release |
| `components/*/README.md`, `templates/*/README.md` | `scripts/component-docs.mjs`, from `component.json` | `npm run docs:components` |
| `platform/o11/out/*` | `platform/o11/generate.mjs` | `npm run o11:generate -- <what>` |
