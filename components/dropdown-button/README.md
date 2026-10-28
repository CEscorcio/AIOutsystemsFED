# DropdownButton

A split button: the left part runs the default action (an OnClick event, or a link when Url is set) and the chevron opens a menu of other actions that the screen puts in the Menu placeholder.

> Generated from `component.json` by `npm run docs:components`. Change the contract and regenerate; `npm test` fails when this page is stale.

## Using the Block in OutSystems

The Block is named `DropdownButton`. Generate it with `npm run o11:generate -- block dropdown-button`, and a test screen with `npm run o11:generate -- harness dropdown-button` ([Components_11.md](../../docs/guide/Components_11.md#generated-lambdas)). It runs the class from the release's Script, and is styled by the components section of the app's theme stylesheet; both come from the same release (`npm run build:all`).

### Input parameters

| Name | Type | Mandatory | Default | Description |
|---|---|---|---|---|
| `Label` | Text | Yes | `""` | The action button's text: verb-led, sentence case, one to three words. |
| `Variant` | Text | No | `"Primary"` | The look. Primary and Secondary are OutSystems UI's btn-primary and btn; Tertiary and Transparent are styled by this component with OutSystems UI variables. Any other value uses Primary. One of: `Primary`, `Secondary`, `Tertiary`, `Transparent`. |
| `Size` | Text | No | `"Medium"` | The height: Medium is OutSystems UI's default button, Small is btn-small, ExtraSmall is this component's own. Any other value uses Medium. One of: `Medium`, `Small`, `ExtraSmall`. |
| `Enabled` | Boolean | No | `True` | False disables both parts and closes the menu. |
| `Url` | Text | No | `""` | When set, the action button is a link to this URL and OnClick isn't raised. Empty makes it a button that raises OnClick. |
| `Icon` | Text | No | `""` | An optional leading icon: a Font Awesome 4 icon name, as in an OutSystems Icon widget (for example th-large). Empty shows none. |
| `MenuLabel` | Text | No | `"More options"` | The chevron's name for screen readers. Translate it like any other label. |
| `ExtendedClass` | Text | No | `""` | Extra classes for the Block's main container, such as a modifier below. Applied by the Block; never reaches the class. |

### Events

| Event | Parameters | Description |
|---|---|---|
| `OnClick` | none | Raised when the action button is clicked and Url is empty. Do the default action here. Raised through the Block's `TriggerClick` client action. |

### Placeholders

| Placeholder | What goes in it |
|---|---|
| `Menu` | The menu's actions: Links (an Icon and a Text inside each), each with its own On Click. It opens from the chevron and closes on a choice, Escape or a click outside. Give each widget the Style Class `dropdown-button__item`. |

### Modifiers

Set through `ExtendedClass`, for example `ExtendedClass = "dropdown-button--menu-end"`.

| Class | Effect |
|---|---|
| `dropdown-button--menu-end` | Opens the menu aligned to the button's end edge, for a button at the end of a row. |

## In the browser

The release's Script registers `window.AIOutsystemsFED.DropdownButton`. The Block drives it from three lifecycle handlers:

- **OnReady**: `new AIOutsystemsFED.DropdownButton({ runtimeId, menuId, label, variant, size, enabled, url, icon, menuLabel, events })`, mounted in the Block's `MountPoint` container; `menuId` is the id of the `MenuContainer` around the `Menu` placeholder
- **OnParametersChanged**: `instance.onParametersChanged({ label, variant, size, enabled, url, icon, menuLabel })`
- **OnDestroy**: `instance.destroy()`

An example screen, `DropdownBTN`, comes from `npm run o11:generate -- showcase dropdown-button`: Variants (Primary, Secondary, Tertiary, Transparent, Disabled); Sizes (Medium, Small, Extra small); Options (Leading icon, Action as a link (Url), Menu at the end).

## Files

| File | What it is |
|---|---|
| [component.json](component.json) | The contract this page is generated from |
| [src/](src/) | The class, its TypeScript contract (`types.ts`) and its registration (`index.ts`) |
| [style/](style/) | The styles (SCSS), BEM block `dropdown-button` ([Style.md](../../docs/guide/Style.md)) |
| [test/checks.js](test/checks.js) | The checks `npm test` runs |
| [preview/index.html](preview/index.html) | A local preview with the real OutSystems UI stylesheet; add `?test=1` to run the checks |
| `dist/` | The built JS and CSS, written by `npm test`; never edited |
