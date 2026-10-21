# Platform notes: OutSystems 11

What OutSystems 11 and the Service Studio MCP do with what this factory uploads, measured rather than assumed. [Components_11.md](Components_11.md) is the procedure; this page is what to expect while following it, and what to check when something looks off.

Measured on 2026-10-21: an O11 personal environment, a Reactive app, OutSystems UI 2.30.0, Service Studio's MCP server. Add a line with the date and setup whenever a measurement here changes.

## What the platform serves

| File | Served as | What changes | What to compare |
|---|---|---|---|
| `dist/components.js`, in the Script | `scripts/<App>.<Script>.js` | A UTF-8 BOM (`EF BB BF`) is added in front. Line endings stay LF and the final newline is kept | Strip the BOM, then the code is **identical** to `dist/components.js` |
| `dist/components.css`, in the theme stylesheet | `css/<App>.<Theme>.css` | The whole stylesheet is served with CRLF line endings; Theme Editor's own lines come out as `\r\r\n` | Normalise line endings, then the text between the markers is **identical** to `dist/components.css` |
| The Block | `scripts/<App>.<Flow>.<Block>.mvc.js` | The JavaScript nodes are compiled verbatim, guards included (`if ($parameters.Instance)` is not rewritten) | Search it for the class name, the parameter names and `$actions.Trigger…` ([step 8b](Components_11.md#8b-the-js-nodes-are-wired-as-you-asked)) |

Find each file's versioned URL in `/<App>/moduleservices/moduleinfo` rather than guessing the path.

**Characters after Theme Editor's block.** Theme Editor's block has been seen to drop the first 2 characters written after it, which can turn a leading `/*` into a stray `*/` that kills the next rule. On 2026-10-21 nothing was dropped. The generated section still starts with the guard rule `.components-start { }`, which absorbs it either way.

## The Model API, in practice

Details the Model API needed that its documentation doesn't make obvious. The generators in `platform/o11/` already do all of this.

- **A Reactive container's Style Classes** is `SetStyle(...)` on `ServiceStudio.Plugin.NRWidgets.IContainer`, not `SetStyleClasses`. `IContainer` is in `ServiceStudio.Plugin.NRWidgets`; write it in full.
- **A Block's lifecycle handlers** are Block screen actions (`block.CreateScreenAction`), wired with `block.OnReady.Destination = action`, and the same for `OnParametersChanged` and `OnDestroy`.
- **A Block event handler on an instance needs its arguments set**: `handler.Arguments.First(a => a.Parameter.Name == "Count").SetValue("Count")`. Without it the module has a "Required Property Value" error.
- **A theme's `StyleSheet` reads back unchanged until the module is saved**, so a dry run can't verify a theme edit. Save, read it back in a separate call, then merge.
- **`InvalidIconLibrary` after a theme edit is a false positive** of the agent's validator. Service Studio's own validation, and the publish, pass. Don't set the theme's icon library to clear it: older Service Studio builds then reject the merge.
- **Reads in parallel fail.** Calling several read tools at once made some fail with "OML not found"; call them one at a time.
- **`omlMerge` returning `merged: true` is final.** `endOmlEditSession` may then report `discardedChanges: true`; that's the working copy being deleted, not the merged changes. Check the live module if in doubt.
- **A screen made with `CreateScreen` comes with a default layout instance.** Delete it and add the layout you want (`LayoutTopMenu`, per [AppGuidelines.md](AppGuidelines.md)). A new `LayoutTopMenu` instance already has the menu in its `Header`.
