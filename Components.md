# Building a custom TypeScript pattern, step by step

How to build your own front-end pattern: written in TypeScript, kept in Git with a build and tests, and shipped into an OutSystems app as a Block, with an AI agent doing the platform work. This page is the part that's the same on every platform: the idea, the rules, and steps 1 to 5. Steps 6 to 8 depend on where you ship:

| Platform | Steps 6 to 8 | Status |
|---|---|---|
| ODC | [Components_ODC.md](Components_ODC.md): three Mentor turns, publish, verify | **Run end to end** on a throwaway app, several publishes measured |
| O11 Reactive | [Components_11.md](Components_11.md): three Model API edits reviewed in Service Studio, 1-Click Publish, verify | **Not yet run end to end** |

The CSS rules every pattern follows are in [Style.md](Style.md). The worked example used on this page is [`greeting-card/`](greeting-card/).

## The idea

Don't try to make Web Components work natively in OutSystems. Use the **Block as a thin bridge** instead: it receives data through Input Parameters, raises Events, and in its lifecycle handlers it creates and drives an instance of a class that lives in a JavaScript bundle built outside the platform. The Block is the small part you see in Studio; the component, with its types, build and tests, is ordinary high-code that evolves in Git and can change without republishing the Block as long as the contract holds.

The technique comes from [*AI-Powered Frontend Development in OutSystems O11 and ODC*](https://antonio-carvalho.medium.com/ai-powered-frontend-development-in-outsystems-o11-and-odc-4d408fdb4ade) by **António Carvalho**.

## What you end up with

```mermaid
flowchart LR
  subgraph Git["Git repo (high-code)"]
    T[types.ts<br/>the contract] --> C[GreetingCard.ts<br/>the class]
    C --> B[esbuild] --> D[dist/GreetingCard.js]
    D --> X[npm test<br/>34 checks in jsdom]
  end
  subgraph App["OutSystems app or module (low-code)"]
    S[Script<br/>GreetingCard.js]
    K[Block GreetingCard<br/>inputs, event, mount Container,<br/>3 JS nodes, bridge action]
    H[Screen using the Block]
    S --> K --> H
  end
  D -- "step 6, through the agent" --> S
  T -. "same names" .-> K
```

- A **Script** in the app holding your bundle, unchanged.
- A **Block** with Input Parameters, an Event, an empty mount Container and three JS nodes. That's the whole platform side.
- A **screen** using the Block, so you can test it and audit the published JavaScript.
- A repo where the component is ordinary TypeScript: code review, type checks, `npm test`, no publish needed to iterate.

The example component is deliberately small: a card that greets a name and counts clicks. It is small so that every part of the bridge is visible: inputs flowing in, `onParametersChanged`, an event flowing back out through a Client Action, and `destroy`. Swap the class for your real component and the rest stays the same.

## Prerequisites for steps 1 to 5

| What | Why | Notes |
|---|---|---|
| Node.js LTS | Build and tests | `winget install OpenJS.NodeJS.LTS` on Windows. **Needs admin rights**; if the installer is cancelled at the elevation prompt it exits with `1602` and nothing is installed |
| Git | The component lives in a repo | Keep `* text=auto eol=lf` in `.gitattributes` (step 4) |

Nothing in steps 1 to 5 needs an OutSystems environment. Each platform guide lists what step 6 onwards needs.

## Step 1: start from the example

Copy [`greeting-card/`](greeting-card/) and rename. With Claude Code, ask for a new pattern (the `new-pattern` skill), or run the script it uses:

```bash
node .claude/skills/new-pattern/scaffold.mjs <Pattern> <Namespace>    # e.g. StatusBadge MyCompany
```

The layout:

```
src/index.ts                         registers window.<Namespace>.<Component>
src/greeting-card/types.ts           the contract with the Block
src/greeting-card/GreetingCard.ts    the class
src/greeting-card/styles.ts          the component's CSS, injected once into <head>
build.mjs                            esbuild -> dist/GreetingCard.js
test/checks.js                       scripted checks, shared by browser and Node
test/run.mjs                         runs the checks in jsdom (npm test)
preview/index.html                   local page; ?test=1 runs the checks in the browser
```

Four things to rename consistently: the **namespace** (`ClaudeTest` → yours, e.g. `MyCompany`), the **class name**, the **output file**, and the **BEM block** (`greeting-card` → your pattern in kebab-case, in every CSS class, the stylesheet id and the tests; see [Rule 0](#rules-for-every-custom-pattern)). The namespace is global, so make it unique to your team.

```
npm install
npm test        # typecheck + build + checks
```

## Step 2: write the contract first

`types.ts` is the one file both sides agree on. Write it before the class and before touching the platform. Every name in it becomes a name in the Block.

```ts
// Block Input Parameters -> GreetingCardParameters
//   Name           Text
//   ButtonLabel    Text
//   ExtendedClass  Text, not mandatory, default "" (every pattern has one).
//                  Applied by the Block's main container, NOT by this class,
//                  so it is deliberately absent from GreetingCardParameters.
//                  Modifiers it accepts: greeting-card--compact
//
// Block Events -> GreetingCardEvents (each wired through a bridge Client Action)
//   OnGreetClicked(Count: Integer)  <- Client Action TriggerGreetClicked(Count)

export interface GreetingCardParameters {
  name: string;
  buttonLabel: string;
}

export interface GreetingCardEvents {
  OnGreetClicked?: (count: number) => void;
}

export interface GreetingCardConfig extends GreetingCardParameters {
  runtimeId: string;           // the mount Container's runtime id
  events?: GreetingCardEvents;
}
```

The comment block at the top is the most useful thing in the file: when you later ask the agent for the Block, you copy names straight from it.

### Rules for every custom pattern

Three conventions apply to every pattern, on both platforms, so they behave like the patterns in OutSystems UI. Rule 0 is the golden rule: no pattern ships without it.

**Rule 0 (golden rule): every CSS class the pattern owns follows BEM, with the pattern class as the block.**

| BEM part | Form | GreetingCard | Who sets it |
|---|---|---|---|
| Block | `<pattern>` | `greeting-card` | The Block's main container (Rule 2) |
| Element | `<pattern>__<element>` | `greeting-card__body`, `__text`, `__title`, `__count`, `__button` | The TypeScript class |
| Modifier | `<pattern>--<modifier>` or `<pattern>__<element>--<modifier>` | `greeting-card--compact` | A screen, through `ExtendedClass` |

OutSystems UI classes go next to the BEM class, never instead of it (`card greeting-card__body`), and a screen picks a variant by passing a modifier in `ExtendedClass`. The full rule, together with the rest of the CSS rules (OutSystems UI variables with base-theme fallbacks, one-class selectors, device classes, right-to-left, accessibility), is in **[Style.md](Style.md)**. `npm test` enforces the parts a script can check.

**Rule 1: an `ExtendedClass` Input Parameter.**

| Property | Value |
|---|---|
| Name | `ExtendedClass` |
| Type | Text |
| Mandatory | **No** |
| Default | `""` |

It's how a screen adapts one instance (spacing, a theme variant, a utility class) without touching the pattern.

**Rule 2: the pattern's main container carries the pattern class plus `ExtendedClass`.** The main container is the Block's outermost widget, the one the component mounts into (`MountPoint` in GreetingCard). Set its **Style Classes** property to the pattern's own class followed by this expression, which is valid on ODC and O11 alike:

```
"greeting-card" + If(ExtendedClass <> NullTextIdentifier(), " " + ExtendedClass, "")
```

- `"greeting-card"` is the pattern class, the BEM block: always present, so the pattern's look and feel can be targeted and inspected.
- The `If` adds a space and the extra classes only when `ExtendedClass` isn't empty, so an empty value never leaves a trailing space.
- Because it's a platform expression, it updates live when `ExtendedClass` changes. The JavaScript doesn't need to know about it.

**`ExtendedClass` is applied in one place only: that container.** Don't also apply it from the TypeScript class. Doing both puts every class on two nested elements, and a spacing class like `margin-top-m` would add its margin twice. That's why `extendedClass` isn't in `GreetingCardParameters`, isn't passed by the JS nodes, and the class never touches the mount element's own classes. `npm test` checks this last point.

## Step 3: write the class to the bridge's rules

The Block will call exactly three things, so the class needs exactly three members:

| Member | Called from | Rules that matter |
|---|---|---|
| `constructor(config)` | `OnReady` | find the mount by `config.runtimeId`; throw a clear error if it's missing; render once |
| `onParametersChanged(params)` | `OnParametersChanged` | accept a **partial** update; never reset internal state the user created (the count survives a name change) |
| `destroy()` | `OnDestroy` | remove **every** listener and observer; make later calls no-ops instead of throwing |

Plus three habits that saved us debugging time:

- **Platform data enters the DOM through `textContent`, never `innerHTML`.** One of the checks feeds `<img src=x onerror=alert(1)>` as the name and asserts it shows up as text.
- **Reuse OutSystems UI classes for anything themed.** The card uses `card` and the button uses `btn btn-primary`, so it follows the app theme. Each of those elements also carries its BEM class (`greeting-card__body`, `greeting-card__button`), which is what your own stylesheet targets. That stylesheet takes every colour, radius, spacing and shadow from OutSystems UI variables, with the base theme's value as fallback for the local preview. See [Style.md](Style.md).
- **Inject the stylesheet once**, keyed by an element id (`<pattern>-styles`), so two instances on one screen don't duplicate it. Keep the CSS in the bundle rather than in the Block's stylesheet: it's reviewed and tested with the component, and on O11 Block stylesheet edits don't reliably publish through the agent.

See [`GreetingCard.ts`](greeting-card/src/greeting-card/GreetingCard.ts) for the full class (about 80 lines).

### What the Block does with it

Step 6 builds this on the platform. The reasons behind two of its parts apply on both platforms:

- **One bridge Client Action per Event.** Inside a JavaScript node, `$actions` reaches Client Actions only, never a Block Event. So each Event gets a Client Action whose only step triggers it, and that action is what's passed into the class (`events: { OnGreetClicked: $actions.TriggerGreetClicked }`). Passing the Event directly is rejected on ODC with `Unknown 'OnGreetClicked' action`; it's the most common reason this technique "mysteriously does not fire anything".
- **Guards in `OnParametersChanged` and `OnDestroy`** (`if ($parameters.Instance) { … }`). `OnParametersChanged` can fire before `OnReady` has finished, and without the guard you get a null reference that's hard to trace back to lifecycle order.

## Step 4: build for diffability, not size

```js
// build.mjs
await build({
  entryPoints: ["src/index.ts"],
  outfile: "dist/GreetingCard.js",
  bundle: true,
  format: "iife",       // no module loader on the platform side
  target: "es2019",
  minify: false,        // so the published copy can be diffed against disk
  legalComments: "none",
});
```

Not minifying is the point: step 8 compares the published Script with this file line by line. The platform serves it as is (measured on ODC), so you lose nothing.

Commit `dist/` too. It's the artifact that goes to OutSystems, and having it in Git is what lets you answer "is what's live what we reviewed?". Keep `* text=auto eol=lf` in `.gitattributes`: Git for Windows converts files to CRLF on checkout by default, which would make every comparison report a difference that isn't really there. Keep the bundle ASCII-only too; content with escape sequences has come back altered from a publish.

**Several components, one file.** When an app uses more than one component, `npm run build:all` at the repo root runs every component's `npm test` and joins their bundles into `dist/components.js`. The file starts with a header giving the build timestamp (UTC) and the bundles it contains, so the published Script says when it was built and from what. It declares `"use strict"` once at the top, then has each component's bundle in alphabetical order. Ship it as one Script (for example `Components`) instead of one Script per component, and check it after publishing the same way as a single bundle: the published Script must match `dist/components.js`. Every build gets a new timestamp, so rebuild just before uploading and commit the file you uploaded.

## Step 5: prove it locally before going to the platform

`npm test` runs `tsc --noEmit`, builds, and then runs [`test/checks.js`](greeting-card/test/checks.js) against the bundle in jsdom:

```
PASS  bundle registers window.ClaudeTest.GreetingCard
PASS  renders inside the mount container
PASS  uses OutSystems UI card and button classes
PASS  every component class is BEM or OutSystems UI
PASS  every variable is an OutSystems UI token with its base-theme fallback
PASS  click fires OnGreetClicked with count 1
PASS  onParametersChanged keeps the count
PASS  markup in data renders as text, not HTML
PASS  container classes (pattern class + ExtendedClass) are untouched on create
PASS  ExtendedClass is not duplicated on the card root
PASS  destroy removes the click listener
PASS  calls after destroy are safe
PASS  missing mount id throws a clear error
...
34/34 passed
```

The same file runs in the browser at `preview/index.html?test=1`. Write a check for every lifecycle rule in step 3; that's what makes AI-written component code safe to accept. Every bug caught here is a platform round trip you don't make, and on ODC a Mentor turn your tenant doesn't spend.

## Steps 6 to 8: ship it on your platform

| | ODC | O11 Reactive |
|---|---|---|
| 6. Platform side | [Three Mentor turns](Components_ODC.md#step-6-the-platform-side-in-three-mentor-turns): Script, Block, harness screen | [Three Model API edits](Components_11.md#step-6-the-platform-side-reviewed-in-service-studio), each reviewed in Compare-and-Merge |
| 7. Publish | [A Mentor turn, then check the live revision](Components_ODC.md#step-7-publish) | [1-Click Publish, then check the module version](Components_11.md#step-7-publish) |
| 8. Verify | [Diff the published Script, find the JS nodes, click through](Components_ODC.md#step-8-verify-what-was-actually-published) | [The same, with O11's paths](Components_11.md#step-8-verify-what-was-actually-published) |

## Making it yours

1. Copy `greeting-card/` with the `new-pattern` skill or `scaffold.mjs`.
2. Write `types.ts`: every Input Parameter, every Event and its payload, and the modifiers `ExtendedClass` accepts. Every pattern gets `ExtendedClass` (Text, not mandatory, default `""`), documented as applied by the main container, not the class.
3. Write the class to the three-member rules and the CSS to [Style.md](Style.md); keep every structural check and add one for each new behaviour; `npm test` until green.
4. Commit, including `dist/`.
5. Steps 6 to 8 in your platform's guide: Script, Block (one bridge Client Action per Event; the main container's Style Classes set to `"<pattern>" + If(ExtendedClass <> NullTextIdentifier(), " " + ExtendedClass, "")`), harness screen, publish, verify.
6. Only then use the Block on real screens.

For a component with real behaviour (a data table, a chart, a rich editor) the platform side barely grows: more Input Parameters and more bridge actions, still three JS nodes. The growth is all in the repo, which is where you want it.

## Going further

Not tested here, but the obvious next steps:

- **Structured data.** Pass lists as JSON Text parameters and parse in the class. Don't send that JSON through an AI agent's prompt: on ODC a column-configuration JSON once came back rewritten (labels changed, columns reordered, keys translated) while still valid, so nothing failed loudly but nothing matched the data either. Paste it by hand, or have it set from a file, and re-read any value that has to match data from the published app.
- **Placeholders.** Let low-code content render inside the component by putting a Placeholder in the Block next to the mount Container and having the class leave it alone.
- **A library instead of an app.** Put the Script and Block in a library so several apps consume one reviewed copy. Each platform guide covers what changes.

## References

- [Style.md](Style.md): the CSS rules for every pattern
- [`greeting-card/`](greeting-card/): the example used on this page
- [AI-Powered Frontend Development in OutSystems O11 and ODC](https://antonio-carvalho.medium.com/ai-powered-frontend-development-in-outsystems-o11-and-odc-4d408fdb4ade): António Carvalho, the source of the technique
