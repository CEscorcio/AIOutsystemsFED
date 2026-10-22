---
name: 'Component tests'
description: "Use when writing or changing a component's checks or test runner."
applyTo: '{components,templates}/*/test/**'
---

# Component tests

`test/checks.js` holds the component's own behaviour checks, as `var componentTest = { block, osuiClasses, config, behaviour }`. The checks every component must pass (BEM, tokens, selectors, logical properties, focus, reduced motion, container classes, no injected CSS, destroy safety) are shared, in `packages/toolchain/structural-checks.js`, and run first. Both run in jsdom (`npm test`, through `packages/toolchain/test.mjs`) and in the browser (the preview page with `?test=1`), so it is a plain browser script in the example's style: ES2017 at most (ESLint enforces it), `var` and `function`, no modules, and it exports through `module.exports` only when `module` exists.

- Replace the example's behaviour checks with the new component's: what it renders, its events, how it handles inputs, and that its listeners go on `destroy`. Don't copy structural checks into it; change the shared file instead, so every component gets the change.
- When a test fails, fix the code, not the test, unless the rule itself changed in Style.md.
- A new rule in Style.md that a script can check gets a check in `packages/toolchain/structural-checks.js`.
