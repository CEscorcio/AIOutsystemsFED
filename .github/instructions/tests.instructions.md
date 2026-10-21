---
name: 'Component tests'
description: "Use when writing or changing a component's checks or test runner."
applyTo: '{components,templates}/*/test/**'
---

# Component tests

`test/checks.js` runs both in jsdom (`npm test`, through `test/run.mjs`) and in the browser (the preview page with `?test=1`), so it is a plain browser script in the example's style: ES2017 at most (ESLint enforces it), `var` and `function`, no modules, and it exports through `module.exports` only when `module` exists.

- Replace the example's behaviour checks with the new component's, but **keep every structural check**: BEM classes and selectors, OutSystems UI tokens and fallbacks, raw colours, `!important`, logical properties, focus, reduced motion, container classes untouched, no stylesheet added by the component, ASCII-only stylesheet, destroy and post-destroy safety, missing mount id.
- When a test fails, fix the code, not the test, unless the rule itself changed in Style.md.
- A new rule in Style.md that a script can check gets a check here.
