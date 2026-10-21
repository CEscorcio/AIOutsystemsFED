---
name: 'Documentation'
description: 'Use when writing or editing the guides, the README or project records.'
applyTo: 'docs/**/*.md,README.md,AGENTS.md'
---

# Documentation

- `docs/guide/` is the factory's guide, the same in every project made from this blueprint. `docs/project/` is this project's records. Something learned in one project that holds in any project goes into the guide, usually [PlatformNotes.md](../../docs/guide/PlatformNotes.md); a guide never links into `docs/project/`, because `npm run init` empties it.
- The guides record what was **measured**. Mark anything not run as not verified, with the date when something was measured.
- No server hostnames, module keys or URLs: use placeholders such as `<server>` and `<App>`.
- Every relative link and `#anchor` must resolve; `npm run lint` runs `scripts/check-links.mjs`.
- Markdown isn't formatted by Prettier here (hand-made tables). Edit a table one row at a time; don't rewrite tables with broad search-and-replace.
