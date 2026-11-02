---
name: new-pattern
description: >-
  Start a new custom front-end pattern by copying the greeting-card example and
  renaming it consistently: class, BEM block, stylesheet file, global namespace,
  bundle and tests. Then reshape the contract, class and CSS for the new
  component and get npm test green. Use when the user asks to create, start,
  scaffold or add a new pattern, component or Block (e.g. "make a StatusBadge
  pattern"). Not for publishing (docs/guide/Components_11.md) or for changing an
  existing pattern.
---

# Start a new pattern

`templates/greeting-card/` is the example every pattern is copied from; it never ships. A missed rename passes silently until the BEM check or a runtime lookup fails, so the copy and rename is done by a script.

## 1. Agree on the names

Ask for, or propose and confirm:

| Name | Form | Example | Becomes |
|---|---|---|---|
| Pattern | PascalCase | `StatusBadge` | the class, `types.ts` interfaces, `dist/StatusBadge.js`, the Script and Block name in OutSystems |
| Namespace | PascalCase, shared by the team's patterns | `MyCompany` | `window.MyCompany.StatusBadge`, what the Block's JS nodes call |

The BEM block is derived: `StatusBadge` → `status-badge`. It must not be an OutSystems UI class (`card`, `tabs`, `popup` …); the script refuses those. Reuse the namespace the team's other patterns use, if any (look at their `src/index.ts`).

## 2. Copy and rename

From the repo root:

```bash
node .claude/skills/new-pattern/scaffold.mjs <Pattern>
```

It creates `components/<pattern-name>/` from `templates/greeting-card/`, skipping `node_modules` and `dist`, and replaces in file contents and paths:

| Example | New |
|---|---|
| `GreetingCard` | `<Pattern>` |
| `greeting-card` | `<pattern-name>` |
| `gc-test-mount` | `<pattern-name>-test-mount` |

Then confirm nothing was missed and the copy is healthy before changing any behaviour:

```bash
grep -rn -E "GreetingCard|greeting-card|gc-test" --exclude-dir=node_modules components/<pattern-name>   # must print nothing
npm install                              # at the repo root: registers the new workspace
npm test -w components/<pattern-name>    # must be green
```

## 3. Make it the new component

Work in this order. Run `npm test` after each step.

1. **`component.json` and `types.ts`, the contract.** `component.json` lists the Block as data (inputs with type, mandatory, default, description and example; events with their params; modifiers); the generators in `platform/o11/` build the Block from it. Keep `namespace` the same as the other components, and don't list `ExtendedClass`. `types.ts` says the same in TypeScript; `npm test` runs `check-contracts` and fails when they disagree. Rewrite the header comment and the interfaces for the real Input Parameters and Events. Keep `ExtendedClass` (Text, not mandatory, default `""`), documented as applied by the Block's main container, never by the class, and list the modifiers it accepts. Every Event gets its bridge Client Action named in the comment.
2. **The class.** Keep the three members and their rules ([Components.md](../../../docs/guide/Components.md), step 3): the constructor finds the mount by `runtimeId` and throws a clear error; `onParametersChanged` takes partial updates and keeps user state; `destroy` removes every listener and makes later calls no-ops. Platform data goes in through `textContent`. The class never touches the mount element's own classes.
3. **`style/<pattern-name>.scss`.** The component's styles in SCSS, compiled by the build to its own stylesheet (`dist/<Pattern>.css`); never add CSS from the class. Nest under the block with `&__element`, keep elements flat, no Sass variables for values and no `@extend` (Style.md, Rule 8). Follow [Style.md](../../../docs/guide/Style.md): BEM elements `<pattern-name>__*`, OutSystems UI classes next to them, OutSystems UI variables with exact base-theme fallbacks, one-class selectors, `.phone`/`.tablet` for widths, logical properties, no focus styles, a reduced-motion override. The tests read every variable's base value from the installed `outsystems-ui` package; nothing to add by hand. Run `npm run lint` too (stylelint, ESLint, Prettier).
4. **`test/checks.js`.** It defines `var componentTest = { block, osuiClasses, config, behaviour }`. Set `block`, the OutSystems UI classes the component may render, and a valid `config`; replace the example's behaviour checks (greeting text, click counting) with the new component's. Only behaviour goes here: the structural checks (BEM, tokens, selectors, logical properties, focus, reduced motion, container classes, no injected CSS, destroy safety) are shared in `packages/toolchain/structural-checks.js` and run for every component; don't copy them.
5. **`preview/index.html`.** Update the demo instance's parameters and events so the page shows the real component.

## 4. Hand over

- `npm test` green, `dist/<Pattern>.js` built.
- Ask before committing, then commit the new folder including `dist/`.
- Tell the user the next step is the platform side: [Components_11.md](../../../docs/guide/Components_11.md) step 6 (Script, stylesheet, Block, harness screen). It's not part of this skill.
