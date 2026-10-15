# Building a new component: step by step

A checklist to follow from "we need a component" to "it's live in an OutSystems app". Each step says what to do, the command or prompt to use, and how you know it's done. The reasons behind each rule are in [Components.md](Components.md) and [Style.md](Style.md); this page links to them instead of repeating them.

The example name throughout is **StatusBadge**. Replace it with yours.

You can do every step by hand, or ask Claude Code. Where Claude Code helps, the step shows the request to type.

## Before you start

| You need | Check |
|---|---|
| Node.js LTS | `node --version` prints v20 or later |
| The repo, installed once at the root | `npm install` at the repo root, then `npm test` passes |
| A place to test it | ODC: a throwaway web app you created. O11: a throwaway Reactive Web app open in Service Studio |
| A design for the component | What it shows, what the screen passes in, what it reports back |

Work on a branch: `git switch -c component/status-badge`.

## Step 1: decide the names

Two names, chosen once and used everywhere:

| Name | Form | StatusBadge example | Becomes |
|---|---|---|---|
| Component | PascalCase | `StatusBadge` | the class, `dist/StatusBadge.js`, the Script and Block names in OutSystems |
| Namespace | PascalCase, shared by the team | `MyCompany` | `window.MyCompany.StatusBadge`, what the Block's JavaScript calls |

The folder and the BEM block are derived from the component name: `components/status-badge/` and `status-badge`.

- **Don't pick an OutSystems UI class name** (`card`, `tabs`, `badge`, `tag` …): its elements would collide with the base theme. `StatusBadge` is fine; `Badge` is not.
- **Reuse the team's namespace** if other components already have one (look in any `components/*/src/index.ts`).

**Done when:** you have both names.

## Step 2: create the component from the example

```bash
node .claude/skills/new-pattern/scaffold.mjs StatusBadge MyCompany
npm install                                  # registers the new workspace
npm test -w components/status-badge          # the copy passes all its checks
```

> **With Claude Code:** "Create a StatusBadge component in the MyCompany namespace."

This copies `components/greeting-card/` to `components/status-badge/` and renames the class, BEM block, stylesheet (`style/status-badge.css`), namespace, bundle and test names.

**Done when:** `npm test -w components/status-badge` is green, and this prints nothing:

```bash
grep -rn -E "GreetingCard|greeting-card|ClaudeTest|gc-test" --exclude-dir=node_modules components/status-badge
```

The copy still behaves like the greeting card. The next steps make it yours.

## Step 3: write the contract

Edit `components/status-badge/src/status-badge/types.ts` first, before any other code. It lists, in its header comment and its interfaces:

- every **Input Parameter** the Block will have, with its OutSystems type and default
- `ExtendedClass` (Text, not mandatory, default `""`), applied by the Block's main container and **not** passed to the class
- the **modifiers** a screen may put in `ExtendedClass` (for example `status-badge--compact`)
- every **Event**, its payload, and the bridge Client Action that raises it (`OnStatusClicked(Status: Text)` ← `TriggerStatusClicked(Status)`)

Details: [Components.md, step 2](Components.md#step-2-write-the-contract-first) and [the rules for every pattern](Components.md#rules-for-every-custom-pattern).

**Done when:** someone could build the Block in OutSystems from this file alone.

## Step 4: write the class

Edit `components/status-badge/src/status-badge/StatusBadge.ts`. Keep the three members and their rules:

| Member | Must |
|---|---|
| `constructor(config)` | find the mount by `config.runtimeId`, throw a clear error if it's missing, render once |
| `onParametersChanged(params)` | accept a partial update, never reset state the user created |
| `destroy()` | remove every listener and observer; make later calls do nothing |

- Put platform data into the page with `textContent`, never `innerHTML`.
- Never touch the mount element's own classes; the Block's container owns them.
- Name every element's class `status-badge__<element>`. Put an OutSystems UI class next to it where a themed widget fits (`btn btn-primary status-badge__button`).

Details: [Components.md, step 3](Components.md#step-3-write-the-class-to-the-bridges-rules).

**Done when:** `npm run typecheck -w components/status-badge` passes.

## Step 5: write the CSS

Edit `components/status-badge/style/status-badge.css`, following [Style.md](Style.md). The build turns the files in `style/` into `dist/StatusBadge.css`, which ships as a stylesheet of its own; the class never adds CSS. In short:

- one BEM class per selector (`.status-badge__label`); the only allowed prefixes are a modifier of the block (`.status-badge--compact`) or an OutSystems UI context class (`.phone`, `.is-rtl`, …)
- every colour, space, radius, border, shadow and font value is an OutSystems UI variable, with its exact base-theme value as fallback: `var(--space-base, 16px)`
- `.phone` / `.tablet` for widths, not media queries
- `padding-inline-start`, not `padding-left`
- no focus styles; a `prefers-reduced-motion` override for any transition
- no `!important`

When you use a variable the tests don't know yet, add it with its base value to `OSUI_TOKENS` in `test/checks.js`. The values are in [Style.md's variable table](Style.md#the-variables-we-use-and-their-base-values).

**Done when:** you've gone through [Style.md's checklist](Style.md#checklist-for-a-new-pattern).

## Step 6: rewrite the tests and the preview

In `components/status-badge/test/checks.js`:

- **Replace** the greeting card's behaviour checks (greeting text, click counting) with your component's: what it renders, what each Input Parameter changes, what each Event sends.
- **Keep every structural check**: BEM classes and selectors, tokens and fallbacks, raw colours, `!important`, logical properties, focus, reduced motion, container classes untouched, the component adds no stylesheet, destroy, calls after destroy, missing mount id.

In `components/status-badge/preview/index.html`, change the demo instance's parameters and events so the page shows your component.

```bash
npm test -w components/status-badge
```

Then open `components/status-badge/preview/index.html` in a browser to look at it, and `preview/index.html?test=1` to run the checks there too.

**Done when:** the tests are green, and the component looks right in the preview at desktop and phone widths.

## Step 7: commit

```bash
git add components/status-badge package-lock.json
git commit -m "Add the StatusBadge component"
```

Commit `dist/` along with the source: `StatusBadge.js` and `StatusBadge.css` are the exact files that go to OutSystems.

**Done when:** `git status` is clean, and a reviewer can read the contract, class, CSS and tests in one change.

## Step 8: put it in OutSystems

Pick your platform and follow its guide. Both have four parts: the **Script** (your bundle), the **stylesheet** (your CSS, in the app's theme stylesheet), the **Block** (Input Parameters, Event, the main container's Style Classes, the bridge Client Action, three lifecycle JavaScript nodes), and a **harness screen** that uses the Block.

| | ODC | O11 Reactive |
|---|---|---|
| Guide | [Components_ODC.md, step 6](Components_ODC.md#step-6-the-platform-side-in-three-mentor-turns) | [Components_11.md, step 6](Components_11.md#step-6-the-platform-side-reviewed-in-service-studio) |
| How | Three Mentor turns, one element each | Three Model API edits, each reviewed in Compare-and-Merge |
| Before you start | [ODC prerequisites](Components_ODC.md#prerequisites) | [O11 prerequisites](Components_11.md#prerequisites) and the [four O11 checks](Components_11.md#before-step-6-four-o11-checks-on-steps-1-to-5) |

> **With Claude Code:** "Add the StatusBadge Script, Block and a test screen to the \<app\> app." It follows the guide for the platform the app is on, one element at a time, and won't publish until you ask.

The main container's Style Classes are always:

```
"status-badge" + If(ExtendedClass <> NullTextIdentifier(), " " + ExtendedClass, "")
```

**Done when:** the Script, the stylesheet section, the Block and the harness screen exist, with no validation errors.

**Several components in one app?** Ship them all in one release: `npm run build:all` writes `dist/components.js` (one Script) and `dist/components.css` (one stylesheet), both starting with the same build timestamp. See [Components.md, step 4](Components.md#step-4-build-for-diffability-not-size).

## Step 9: publish and prove it

Publish, then check three things. A "published successfully" message alone isn't proof.

1. **The live version is the new one.** ODC: the environment reports the new revision. O11: Service Center shows the new module version.
2. **The published files are yours.** Download the Script and compare it with `dist/StatusBadge.js` (on ODC, `verify-script.sh` does it for you), and check the theme's CSS holds your stylesheet section with the right timestamp ([ODC 8a](Components_ODC.md#8a-the-script-is-your-bundle), [O11 8a](Components_11.md#8a-the-script-is-your-bundle)).
3. **It works in a browser.** Open the harness screen: it renders, each Input Parameter change shows, each Event reaches OutSystems, the main container has `status-badge` plus any `ExtendedClass`, and the console is clean.

> **With Claude Code:** "Publish \<app\> and verify the StatusBadge Script." On ODC, later updates are one request: "Republish StatusBadge to ODC" (the `publish-pattern-odc` skill).

**Done when:** all three checks pass.

## Step 10: use it and hand it over

- Put the Block on real screens. Screens follow [AppGuidelines.md](AppGuidelines.md).
- Change one instance's look only through a modifier in `ExtendedClass`, never by restyling `.card`, `.btn` or the component's elements from a screen.
- Open a pull request with the component, and note in it which app and environment it was proven in.

## Quick checklist

1. Names chosen; not an OutSystems UI class name.
2. Scaffolded, `npm install`, copy's tests green, no `GreetingCard` left.
3. `types.ts`: every input, event, modifier and bridge action listed.
4. Class: three members, `textContent` only, mount classes untouched.
5. CSS in `style/`: BEM, OutSystems UI variables with base fallbacks, Style.md checklist.
6. Tests rewritten with every structural check kept; preview updated; `npm test` green.
7. Committed with `dist/`.
8. Script, stylesheet, Block and harness in OutSystems, no validation errors.
9. Published; live version, Script diff and browser check all pass.
10. On real screens through modifiers; pull request opened.
