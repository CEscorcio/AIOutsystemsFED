# Sparkline

Draws a small inline trend line from a list of numbers, for KPI cards and table rows, in the theme's colours.

> Generated from `component.json` by `npm run docs:components`. Change the contract and regenerate; `npm test` fails when this page is stale.

## Using the Block in OutSystems

The Block is named `Sparkline`. Generate it with `npm run o11:generate -- block sparkline`, and a test screen with `npm run o11:generate -- harness sparkline` ([Components_11.md](../../docs/guide/Components_11.md#generated-lambdas)). It runs the class from the release's Script, and is styled by the components section of the app's theme stylesheet; both come from the same release (`npm run build:all`).

### Input parameters

| Name | Type | Mandatory | Default | Description |
|---|---|---|---|---|
| `Values` | Text | Yes | `""` | The numbers, in order, separated by commas, semicolons or spaces (for example 3,5,2,8). Use a dot for decimals. Fewer than two numbers draw nothing. |
| `Label` | Text | No | `""` | What the line shows, read by screen readers (for example Sales, last 7 days). The first and last values are added to it. |
| `ShowLast` | Boolean | No | `True` | Mark the last point with a dot. |
| `ExtendedClass` | Text | No | `""` | Extra classes for the Block's main container, such as a modifier below. Applied by the Block; never reaches the class. |

### Events

None.

### Modifiers

Set through `ExtendedClass`, for example `ExtendedClass = "sparkline--positive"`.

| Class | Effect |
|---|---|
| `sparkline--positive` | The line in the success colour, for a trend that's good news. |
| `sparkline--negative` | The line in the error colour, for a trend that's bad news. |

## In the browser

The release's Script registers `window.AIOutsystemsFED.Sparkline`. The Block drives it from three lifecycle handlers:

- **OnReady**: `new AIOutsystemsFED.Sparkline({ runtimeId, values, label, showLast })`, mounted in the Block's `MountPoint` container
- **OnParametersChanged**: `instance.onParametersChanged({ values, label, showLast })`
- **OnDestroy**: `instance.destroy()`

## Files

| File | What it is |
|---|---|
| [component.json](component.json) | The contract this page is generated from |
| [src/](src/) | The class, its TypeScript contract (`types.ts`) and its registration (`index.ts`) |
| [style/](style/) | The styles (SCSS), BEM block `sparkline` ([Style.md](../../docs/guide/Style.md)) |
| [test/checks.js](test/checks.js) | The checks `npm test` runs |
| [preview/index.html](preview/index.html) | A local preview with the real OutSystems UI stylesheet; add `?test=1` to run the checks |
| `dist/` | The built JS and CSS, written by `npm test`; never edited |
