---
name: 'Component code'
description: "Use when writing or changing a component's TypeScript class or its registration."
applyTo: '{components,templates}/*/src/**/*.ts'
---

# Component code

The rules are in [Components.md, step 3](../../docs/guide/Components.md); the example is [templates/greeting-card/](../../templates/greeting-card/).

- The class has three public members, called from the Block: the constructor (from OnReady), `onParametersChanged(partial)` (from OnParametersChanged) and `destroy()` (from OnDestroy). Keep that shape.
- The constructor finds its mount element with `document.getElementById(config.runtimeId)` and throws a clear error when it's missing. It renders inside the mount and never changes the mount element's own classes (the Block's Style Classes own them).
- Every visible string, screen-reader text included, comes from an input, with the English text as its default and `{placeholders}` for values (Components.md, Rule 3). The class falls back to those defaults only when an input is empty.
- Platform data enters the DOM through `textContent` only. `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write` and `eval` are banned by ESLint.
- No CSS from the class: no `<style>`, no `<link>`, no inline style for looks. Styles live in `style/` and ship as their own stylesheet.
- `onParametersChanged` takes partial updates and keeps user state (counts, selections). `destroy` removes every listener it added, and every later call is a no-op.
- Events call the callbacks in `config.events`; never touch OutSystems internals.
- `src/index.ts` only exports the class; the build registers it as `window.<namespace>.<Class>`, with the namespace from `factory.config.json`. Never touch `window` in it.
- Keep the bundle ASCII-only and target ES2019; the build doesn't minify, so the published Script can be compared with `dist/`.
