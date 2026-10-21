# Architecture decisions

Why the factory works the way it does, one decision per file, so the reasons survive the people who knew them. A decision that only applies to one project goes in that project's `docs/project/` instead.

Write one with the `/adr` prompt (Copilot) or by hand: copy the template below into `NNNN-<short-title>.md` with the next number, and add it to the index. A record is never rewritten when the decision changes; a new one supersedes it, and the old one's status says so.

## Index

| # | Decision | Status |
|---|---|---|
| | _None recorded yet. Candidates, each already argued in the guides or commit history: the Block as a thin bridge with a bridge Client Action; component CSS in the theme stylesheet, not the Block's; SCSS for grouping only; one Script and one stylesheet per release; contracts as data (`component.json`); a config-driven blueprint._ | |

## Template

```markdown
# NNNN: <the decision, as a short sentence>

- **Status:** Accepted (YYYY-MM-DD) | Superseded by NNNN
- **Applies to:** <the part of the factory>

## Context

What problem or constraint forced a choice, with what was measured.

## Decision

What we do, stated as a rule.

## Consequences

What gets easier, what gets harder, and what would make us revisit it.
```
