## What and why

<!-- What changes, and the reason. Link the issue if there is one. -->

## Kind of change

- [ ] Component (code, styles, tests or contract)
- [ ] Factory (build, checks, generators, release tooling, templates)
- [ ] Docs only
- [ ] Release (`dist/components.*` and `releases/`)

## Definition of Done

- [ ] `npm test` passes locally, and CI is green
- [ ] **Contract:** `component.json` and `types.ts` changed together, or not at all. A **breaking** change (an input, event or modifier removed, a type changed, a new mandatory input) is named here, with the screens it affects
- [ ] **Styles** follow [Style.md](../docs/guide/Style.md): BEM, OutSystems UI variables with base-theme fallbacks, no `!important`, logical properties, a reduced-motion override
- [ ] **Tests:** behaviour checks for what changed; a new Style.md rule a script can check gets a structural check in `packages/toolchain/structural-checks.js`
- [ ] **Docs:** the guide or the component README updated if behaviour changed (`npm run docs:components` regenerates component READMEs); links resolve
- [ ] **No generated file edited by hand**, and no hostname, key or token committed
- [ ] **Release only:** uploaded and checked first; `releases/<version>.json` recorded with where it went and what was verified

## How it was checked

<!-- Commands run, preview pages opened, what was compared in OutSystems. -->
