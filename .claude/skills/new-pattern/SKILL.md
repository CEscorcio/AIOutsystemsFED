---
name: new-pattern
description: >-
  Start a new custom front-end pattern by copying the greeting-card example and
  renaming it consistently: class, BEM block, stylesheet id, global namespace,
  bundle and tests. Then reshape the contract, class and CSS for the new
  component and get npm test green. Use when the user asks to create, start,
  scaffold or add a new pattern, component or Block (e.g. "make a StatusBadge
  pattern"). Not for publishing (publish-pattern-odc) or for changing an
  existing pattern.
---

# Start a new pattern

`components/greeting-card/` is the example every pattern is copied from. A missed rename passes silently until the BEM check or a runtime lookup fails, so the copy and rename is done by a script.

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
node .claude/skills/new-pattern/scaffold.mjs <Pattern> <Namespace>
```

It creates `components/<pattern-name>/` next to `components/greeting-card/`, skipping `node_modules` and `dist`, and replaces in file contents and paths:

| Example | New |
|---|---|
| `GreetingCard` | `<Pattern>` |
| `greeting-card` | `<pattern-name>` |
| `ClaudeTest` | `<Namespace>` |
| `gc-test-mount` | `<pattern-name>-test-mount` |

Then confirm nothing was missed and the copy is healthy before changing any behaviour:

```bash
grep -rn -E "GreetingCard|greeting-card|ClaudeTest|gc-test" --exclude-dir=node_modules components/<pattern-name>   # must print nothing
npm install                              # at the repo root: registers the new workspace
npm test -w components/<pattern-name>    # must be green
```

## 3. Make it the new component

Work in this order. Run `npm test` after each step.

1. **`types.ts`, the contract.** Rewrite the header comment and the interfaces for the real Input Parameters and Events. Keep `ExtendedClass` (Text, not mandatory, default `""`), documented as applied by the Block's main container, never by the class, and list the modifiers it accepts. Every Event gets its bridge Client Action named in the comment.
2. **The class.** Keep the three members and their rules ([Components.md](../../../docs/Components.md), step 3): the constructor finds the mount by `runtimeId` and throws a clear error; `onParametersChanged` takes partial updates and keeps user state; `destroy` removes every listener and makes later calls no-ops. Platform data goes in through `textContent`. The class never touches the mount element's own classes.
3. **`styles.ts`.** Follow [Style.md](../../../docs/Style.md): BEM elements `<pattern-name>__*`, OutSystems UI classes next to them, OutSystems UI variables with exact base-theme fallbacks, one-class selectors, `.phone`/`.tablet` for widths, logical properties, no focus styles, a reduced-motion override. Add each new variable to `OSUI_TOKENS` in `test/checks.js` with its value from `OutSystemsUI.css`.
4. **`test/checks.js`.** Replace the example's behaviour checks (greeting text, click counting) with the new component's. **Keep every structural check**: BEM classes and selectors, tokens and fallbacks, raw colours, `!important`, logical properties, focus, reduced motion, container classes untouched, styles injected once, destroy and post-destroy safety, missing mount id.
5. **`preview/index.html`.** Update the demo instance's parameters and events so the page shows the real component.

## 4. Hand over

- `npm test` green, `dist/<Pattern>.js` built.
- Ask before committing, then commit the new folder including `dist/`.
- Tell the user the next step is the platform side: [Components_ODC.md](../../../docs/Components_ODC.md) step 6 (Script, Block, harness screen) or [Components_11.md](../../../docs/Components_11.md). It's not part of this skill.
