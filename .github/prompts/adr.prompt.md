---
name: 'adr'
description: 'Record an architecture decision in docs/guide/adr/.'
argument-hint: 'The decision, e.g. "component CSS goes in the theme stylesheet, not the Block''s"'
agent: 'agent'
---

Record this decision: ${input:decision:What was decided?}

Read [docs/guide/adr/README.md](../../docs/guide/adr/README.md) for the format and the numbering. Then:

1. Find the evidence in the repo first: the guides, `docs/guide/PlatformNotes.md`, commit messages (`git log --grep`), the release records. A decision record says why, with what was measured; don't invent reasons.
2. Write `docs/guide/adr/NNNN-<short-title>.md` with the next number, using the template.
3. Add it to the index in `docs/guide/adr/README.md`.
4. Where a guide states the rule, link it to the new record.
5. `npm run lint` (the link check) must pass.

A decision that only applies to this project goes in `docs/project/` instead, since the guide is shared by every project made from the blueprint.
