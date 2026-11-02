# ConfirmButton

A button for destructive actions that asks for a second click: the first click arms it, the second confirms, and it disarms after a few seconds, on blur or on Escape.

> Generated from `component.json` by `npm run docs:components`. Change the contract and regenerate; `npm test` fails when this page is stale.

## Using the Block in OutSystems

The Block is named `ConfirmButton`. Generate it with `npm run o11:generate -- block confirm-button`, and a test screen with `npm run o11:generate -- harness confirm-button` ([Components_11.md](../../docs/guide/Components_11.md#generated-lambdas)). It runs the class from the release's Script, and is styled by the components section of the app's theme stylesheet; both come from the same release (`npm run build:all`).

### Input parameters

| Name | Type | Mandatory | Default | Description |
|---|---|---|---|---|
| `Label` | Text | Yes | `""` | The button's text before it's armed. |
| `ConfirmLabel` | Text | No | `"Click again to confirm"` | The button's text while it's armed, also announced to screen readers. |
| `TimeoutSeconds` | Integer | No | `4` | How long it stays armed before going back to Label. 0 or less uses 4. |
| `IsDisabled` | Boolean | No | `False` | Disables the button, and disarms it. |
| `ExtendedClass` | Text | No | `""` | Extra classes for the Block's main container, such as a modifier below. Applied by the Block; never reaches the class. |

### Events

| Event | Parameters | Description |
|---|---|---|
| `OnConfirmed` | none | Raised on the second click, while armed. Do the destructive action here. Raised through the Block's `TriggerConfirmed` client action. |

### Modifiers

Set through `ExtendedClass`, for example `ExtendedClass = "confirm-button--full-width"`.

| Class | Effect |
|---|---|
| `confirm-button--full-width` | The button fills its container's width, as on phones. |

## In the browser

The release's Script registers `window.AIOutsystemsFED.ConfirmButton`. The Block drives it from three lifecycle handlers:

- **OnReady**: `new AIOutsystemsFED.ConfirmButton({ runtimeId, label, confirmLabel, timeoutSeconds, isDisabled, events })`, mounted in the Block's `MountPoint` container
- **OnParametersChanged**: `instance.onParametersChanged({ label, confirmLabel, timeoutSeconds, isDisabled })`
- **OnDestroy**: `instance.destroy()`

## Files

| File | What it is |
|---|---|
| [component.json](component.json) | The contract this page is generated from |
| [src/](src/) | The class, its TypeScript contract (`types.ts`) and its registration (`index.ts`) |
| [style/](style/) | The styles (SCSS), BEM block `confirm-button` ([Style.md](../../docs/guide/Style.md)) |
| [test/checks.js](test/checks.js) | The checks `npm test` runs |
| [preview/index.html](preview/index.html) | A local preview with the real OutSystems UI stylesheet; add `?test=1` to run the checks |
| `dist/` | The built JS and CSS, written by `npm test`; never edited |
