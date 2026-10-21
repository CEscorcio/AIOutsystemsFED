# Copilot instructions

Read [AGENTS.md](../AGENTS.md) at the repo root before anything else: it holds the standing rules for every AI agent in this repo, Copilot included. The file-specific rules are in [.github/instructions/](instructions/), and the guides they point to are in [docs/guide/](../docs/guide/).

The essentials, in case you read only this:

- This is an **OutSystems 11** (Reactive Web) component factory. Each component is TypeScript plus SCSS in `components/<name>/`, described by `component.json`, and becomes a thin Block in OutSystems. `templates/greeting-card/` is the example components are copied from; it never ships.
- **`npm test` must pass** before you propose a change: it lints (ESLint, link check, stylelint, Prettier), builds and tests every component, and checks every `component.json` against its code.
- **Never edit generated files**: `dist/`, `components/*/dist/`, `releases/`, `docs/project/Releases.md`, `CHANGELOG.md` entries, `platform/o11/out/`. Change the source and rebuild.
- **Never invent OutSystems UI values.** Every colour, space, radius, shadow and font value in CSS is an OutSystems UI variable with its exact base-theme fallback ([Style.md](../docs/guide/Style.md), Rule 2). The tests check it.
- **Platform data enters the DOM through `textContent` only**, never `innerHTML`. ESLint enforces it.
- **No server hostnames, URLs or keys** in committed files. Environments are labels like `dev` or `prod`.
- The OutSystems side (Scripts, Blocks, publishing) runs through Service Studio's MCP server on a developer's Windows machine. In the cloud you can't reach it: prepare the change and the generated lambdas (`npm run o11:generate`), and say what's left for someone with Service Studio.

## Reviewing a pull request

Check, in this order:

1. `npm test` passes in CI.
2. CSS follows [Style.md](../docs/guide/Style.md): one BEM class per selector, OutSystems UI variables with base-theme fallbacks, logical properties, no focus styles, a reduced-motion override, no `!important`. In SCSS: elements flat, no Sass variables for values, no `@extend` (Rule 8).
3. A change to `component.json` comes with the matching `types.ts` and CSS change. Removing an input, event or modifier, changing a type, or adding a mandatory input is **breaking**: say so in the review.
4. Component code: three public members (constructor, `onParametersChanged`, `destroy`), mount found by `runtimeId`, the mount element's classes untouched, no CSS injected, every listener removed in `destroy`.
5. No generated file edited by hand, no hostname committed, docs links valid (`check-links` runs in lint).
