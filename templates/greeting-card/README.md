# GreetingCard

A card that greets a name and counts how many times its button was clicked.

> Generated from `component.json` by `npm run docs:components`. Change the contract and regenerate; `npm test` fails when this page is stale.

## Using the Block in OutSystems

The Block is named `GreetingCard`. Generate it with `npm run o11:generate -- block greeting-card`, and a test screen with `npm run o11:generate -- harness greeting-card` ([Components_11.md](../../docs/guide/Components_11.md#generated-lambdas)). It runs the class from the release's Script, and is styled by the components section of the app's theme stylesheet; both come from the same release (`npm run build:all`).

### Input parameters

| Name | Type | Mandatory | Default | Description |
|---|---|---|---|---|
| `Name` | Text | Yes | `""` | The name to greet. An empty name shows "there". |
| `ButtonLabel` | Text | No | `"Greet"` | The button's text. Empty falls back to "Greet". |
| `ExtendedClass` | Text | No | `""` | Extra classes for the Block's main container, such as a modifier below. Applied by the Block; never reaches the class. |

### Events

| Event | Parameters | Description |
|---|---|---|
| `OnGreetClicked` | `Count` (Integer): How many times the button was clicked. | Raised on every button click. Raised through the Block's `TriggerGreetClicked` client action. |

### Modifiers

Set through `ExtendedClass`, for example `ExtendedClass = "greeting-card--compact"`.

| Class | Effect |
|---|---|
| `greeting-card--compact` | Tighter padding and a smaller title. |

## In the browser

The release's Script registers `window.ClaudeTest.GreetingCard`. The Block drives it from three lifecycle handlers:

- **OnReady**: `new ClaudeTest.GreetingCard({ runtimeId, name, buttonLabel, events })`, mounted in the Block's `MountPoint` container
- **OnParametersChanged**: `instance.onParametersChanged({ name, buttonLabel })`
- **OnDestroy**: `instance.destroy()`

## Files

| File | What it is |
|---|---|
| [component.json](component.json) | The contract this page is generated from |
| [src/](src/) | The class, its TypeScript contract (`types.ts`) and its registration (`index.ts`) |
| [style/](style/) | The styles (SCSS), BEM block `greeting-card` ([Style.md](../../docs/guide/Style.md)) |
| [test/checks.js](test/checks.js) | The checks `npm test` runs |
| [preview/index.html](preview/index.html) | A local preview with the real OutSystems UI stylesheet; add `?test=1` to run the checks |
| `dist/` | The built JS and CSS, written by `npm test`; never edited |
