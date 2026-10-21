---
name: 'review-style'
description: "Review a component's stylesheet against Style.md, beyond what the tests check."
argument-hint: 'The component folder, e.g. components/status-badge'
agent: 'ask'
---

Review the styles of ${input:component:Component folder, e.g. components/status-badge} against [Style.md](../../docs/guide/Style.md).

`npm test` already checks the mechanical rules (BEM selectors, tokens and fallbacks, raw colours, `!important`, logical properties, focus, reduced motion, width media queries). Run it, then review what it can't check:

- **Semantic tokens**: `--color-primary`, `--color-error`, … rather than palette colours where the meaning is semantic.
- **Contrast**: text on `--color-neutral-0` uses `--color-neutral-7` or darker; text on a primary tint uses `--color-primary`. Flag anything that could become unreadable when the app's theme changes its colours.
- **Hover-only signals**: anything hover reveals must also be reachable by keyboard.
- **Modifiers**: does each one belong in the component, or is it one screen's need? Is each documented in `component.json`?
- **SCSS** (Rule 8): elements flat, no declarations on the block itself, one reduced-motion block.

Answer as a list grouped by severity, with the file and line for each point.
