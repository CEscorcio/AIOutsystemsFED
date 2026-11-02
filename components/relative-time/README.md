# RelativeTime

Shows a date and time relative to now, such as 3 minutes ago or in 2 days, in the user's language, with the exact date on hover, and keeps it current.

> Generated from `component.json` by `npm run docs:components`. Change the contract and regenerate; `npm test` fails when this page is stale.

## Using the Block in OutSystems

The Block is named `RelativeTime`. Generate it with `npm run o11:generate -- block relative-time`, and a test screen with `npm run o11:generate -- harness relative-time` ([Components_11.md](../../docs/guide/Components_11.md#generated-lambdas)). It runs the class from the release's Script, and is styled by the components section of the app's theme stylesheet; both come from the same release (`npm run build:all`).

### Input parameters

| Name | Type | Mandatory | Default | Description |
|---|---|---|---|---|
| `Timestamp` | Text | Yes | `""` | The moment to show, in ISO 8601 (for example 2026-10-22T10:00:00Z). From an OutSystems DateTime, use FormatDateTime(<value>, "yyyy-MM-ddTHH:mm:ss"), which is read in the browser's time zone; add "Z" when the value is UTC. |
| `Locale` | Text | No | `""` | A BCP 47 language tag such as pt-PT or en-GB, for the words and the date format. Empty uses the browser's language. |
| `EmptyLabel` | Text | No | `""` | Shown when Timestamp is empty or not a valid date. |
| `Live` | Boolean | No | `True` | Refresh the text every 30 seconds, so 'just now' becomes '1 minute ago' without a screen refresh. |
| `ExtendedClass` | Text | No | `""` | Extra classes for the Block's main container, such as a modifier below. Applied by the Block; never reaches the class. |

### Events

None.

### Modifiers

Set through `ExtendedClass`, for example `ExtendedClass = "relative-time--muted"`.

| Class | Effect |
|---|---|
| `relative-time--muted` | Secondary text colour and a smaller size, for metadata lines. |

## In the browser

The release's Script registers `window.AIOutsystemsFED.RelativeTime`. The Block drives it from three lifecycle handlers:

- **OnReady**: `new AIOutsystemsFED.RelativeTime({ runtimeId, timestamp, locale, emptyLabel, live })`, mounted in the Block's `MountPoint` container
- **OnParametersChanged**: `instance.onParametersChanged({ timestamp, locale, emptyLabel, live })`
- **OnDestroy**: `instance.destroy()`

## Files

| File | What it is |
|---|---|
| [component.json](component.json) | The contract this page is generated from |
| [src/](src/) | The class, its TypeScript contract (`types.ts`) and its registration (`index.ts`) |
| [style/](style/) | The styles (SCSS), BEM block `relative-time` ([Style.md](../../docs/guide/Style.md)) |
| [test/checks.js](test/checks.js) | The checks `npm test` runs |
| [preview/index.html](preview/index.html) | A local preview with the real OutSystems UI stylesheet; add `?test=1` to run the checks |
| `dist/` | The built JS and CSS, written by `npm test`; never edited |
