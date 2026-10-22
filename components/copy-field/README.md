# CopyField

Shows a value, such as a reference number, an API key or a link, with a button that copies it to the clipboard and confirms it.

> Generated from `component.json` by `npm run docs:components`. Change the contract and regenerate; `npm test` fails when this page is stale.

## Using the Block in OutSystems

The Block is named `CopyField`. Generate it with `npm run o11:generate -- block copy-field`, and a test screen with `npm run o11:generate -- harness copy-field` ([Components_11.md](../../docs/guide/Components_11.md#generated-lambdas)). It runs the class from the release's Script, and is styled by the components section of the app's theme stylesheet; both come from the same release (`npm run build:all`).

### Input parameters

| Name | Type | Mandatory | Default | Description |
|---|---|---|---|---|
| `Value` | Text | Yes | `""` | The text shown and copied. |
| `Label` | Text | No | `""` | A label above the value. Empty shows none. |
| `CopyLabel` | Text | No | `"Copy"` | The button's text. |
| `CopiedLabel` | Text | No | `"Copied"` | Shown on the button for two seconds after a copy, and announced to screen readers. |
| `ExtendedClass` | Text | No | `""` | Extra classes for the Block's main container, such as a modifier below. Applied by the Block; never reaches the class. |

### Events

| Event | Parameters | Description |
|---|---|---|
| `OnCopied` | `Value` (Text): The text that was copied. | Raised after the value was copied to the clipboard. Raised through the Block's `TriggerCopied` client action. |

### Modifiers

Set through `ExtendedClass`, for example `ExtendedClass = "copy-field--compact"`.

| Class | Effect |
|---|---|
| `copy-field--compact` | Smaller text and padding, for tables and dense forms. |

## In the browser

The release's Script registers `window.AIOutsystemsFED.CopyField`. The Block drives it from three lifecycle handlers:

- **OnReady**: `new AIOutsystemsFED.CopyField({ runtimeId, value, label, copyLabel, copiedLabel, events })`, mounted in the Block's `MountPoint` container
- **OnParametersChanged**: `instance.onParametersChanged({ value, label, copyLabel, copiedLabel })`
- **OnDestroy**: `instance.destroy()`

## Files

| File | What it is |
|---|---|
| [component.json](component.json) | The contract this page is generated from |
| [src/](src/) | The class, its TypeScript contract (`types.ts`) and its registration (`index.ts`) |
| [style/](style/) | The styles (SCSS), BEM block `copy-field` ([Style.md](../../docs/guide/Style.md)) |
| [test/checks.js](test/checks.js) | The checks `npm test` runs |
| [preview/index.html](preview/index.html) | A local preview with the real OutSystems UI stylesheet; add `?test=1` to run the checks |
| `dist/` | The built JS and CSS, written by `npm test`; never edited |
