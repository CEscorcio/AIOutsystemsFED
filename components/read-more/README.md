# ReadMore

Shows long text clamped to a number of lines, with a Show more / Show less toggle that only appears when the text doesn't fit.

> Generated from `component.json` by `npm run docs:components`. Change the contract and regenerate; `npm test` fails when this page is stale.

## Using the Block in OutSystems

The Block is named `ReadMore`. Generate it with `npm run o11:generate -- block read-more`, and a test screen with `npm run o11:generate -- harness read-more` ([Components_11.md](../../docs/guide/Components_11.md#generated-lambdas)). It runs the class from the release's Script, and is styled by the components section of the app's theme stylesheet; both come from the same release (`npm run build:all`).

### Input parameters

| Name | Type | Mandatory | Default | Description |
|---|---|---|---|---|
| `Text` | Text | Yes | `""` | The text. Line breaks are kept. |
| `Lines` | Integer | No | `3` | How many lines to show while collapsed. 0 or less uses 3. |
| `MoreLabel` | Text | No | `"Show more"` | The toggle's text while collapsed. |
| `LessLabel` | Text | No | `"Show less"` | The toggle's text while expanded. |
| `ExtendedClass` | Text | No | `""` | Extra classes for the Block's main container, such as a modifier below. Applied by the Block; never reaches the class. |

### Events

| Event | Parameters | Description |
|---|---|---|
| `OnToggled` | `IsExpanded` (Boolean): True when the text is now shown in full. | Raised when the user expands or collapses the text. Raised through the Block's `TriggerToggled` client action. |

### Modifiers

Set through `ExtendedClass`, for example `ExtendedClass = "read-more--muted"`.

| Class | Effect |
|---|---|
| `read-more--muted` | Secondary text colour and a smaller size, for descriptions under a title. |

## In the browser

The release's Script registers `window.AIOutsystemsFED.ReadMore`. The Block drives it from three lifecycle handlers:

- **OnReady**: `new AIOutsystemsFED.ReadMore({ runtimeId, text, lines, moreLabel, lessLabel, events })`, mounted in the Block's `MountPoint` container
- **OnParametersChanged**: `instance.onParametersChanged({ text, lines, moreLabel, lessLabel })`
- **OnDestroy**: `instance.destroy()`

## Files

| File | What it is |
|---|---|
| [component.json](component.json) | The contract this page is generated from |
| [src/](src/) | The class, its TypeScript contract (`types.ts`) and its registration (`index.ts`) |
| [style/](style/) | The styles (SCSS), BEM block `read-more` ([Style.md](../../docs/guide/Style.md)) |
| [test/checks.js](test/checks.js) | The checks `npm test` runs |
| [preview/index.html](preview/index.html) | A local preview with the real OutSystems UI stylesheet; add `?test=1` to run the checks |
| `dist/` | The built JS and CSS, written by `npm test`; never edited |
