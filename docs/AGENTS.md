# Working in this repo

Custom front-end patterns for **OutSystems 11** (Reactive Web), built in TypeScript and shipped into a module as a Block that bridges to the bundle. [Components.md](Components.md) covers the idea, the rules and steps 1 to 5 (everything done in the repo); [Components_11.md](Components_11.md) covers steps 6 to 8 in OutSystems 11 through Service Studio's MCP server. [README.md](../README.md) has the overview. This repo targets O11 only; don't add ODC content.

## Standing rules

- **[Style.md](Style.md) governs all pattern CSS.** BEM under the pattern block is the golden rule (Rule 0). Every visual value is an OutSystems UI variable whose fallback is its exact base-theme value. Read Style.md before writing or reviewing any CSS.
- **[AppGuidelines.md](AppGuidelines.md) governs app screens.** Read it before creating or changing a screen; new screens use `Layouts\LayoutTopMenu`, not `LayoutBlank` (Rule 1), and are created in the `MainFlow` UI flow (Rule 2).
- **New components follow [NewComponent.md](NewComponent.md)**, step by step; walk the user through it when they start one.
- **Components live in `components/<name>/`**, one npm workspace each; install once at the repo root. **`components/greeting-card/` is an example**, not the product. New components are copies of it (use the `new-pattern` skill). Don't add features to it unless asked. `npm run build:all` ships every folder in `components/`, the example included.
- **`npm test` must be green** (at the repo root for every component, or `npm test -w components/<name>` for one) before anything goes to OutSystems. When a test fails, fix the code, never the test, unless the rule itself changed in Style.md.
- **Every new Style.md rule that a script can check gets a check** in `test/checks.js`. Base-theme values come from the installed `outsystems-ui` package; don't hand-copy them.
- **`dist/` is committed.** It's what goes to OutSystems; rebuild it with `npm test`, never edit it by hand.
- **A component's CSS lives in `style/<name>.css` and ships as its own stylesheet** (`dist/<Name>.css`, in the app's theme stylesheet), never from the JavaScript. See Style.md, Rule 7.
- **`dist/components.js` and `dist/components.css` (from `npm run build:all`) are committed only when they're uploaded.** Every build writes a new timestamp, so commit the exact files that went to OutSystems, together with where they went, and leave other builds uncommitted. Upload both from the same build. Their `Version: <ISO year>.<ISO week>.<N>` (UTC) takes N from the last committed `dist/components.js`, so committing a build that wasn't uploaded uses up a release number; never edit the version by hand.
- **Line endings are LF** (`.gitattributes`). Keep bundles ASCII-only, since non-ASCII content has come back altered from a publish.

## OutSystems actions

- **Never publish, merge, create a module or change a Script or stylesheet without the user asking** in the current request. Reading (listing modules, reading screens or actions, downloading published files) needs no confirmation.
- **A component's platform side hasn't been run end to end yet.** Follow Components_11.md. When you run it, record what actually happened in the guide (and remove its "not yet run" status) before writing a publish skill for it.
- **One request does one thing**: one Script, or one stylesheet section, or one Block, or one screen, each reviewed in its own Compare-and-Merge.
- **A publish is confirmed only when** Service Studio reports it done **and** the files the server serves (from `/<App>/moduleservices/moduleinfo`) match `dist/`: the Script, the theme's component section, and the compiled screen.
- **On O11, dry-run every Model API edit first.** Run the lambda once ending in `throw new Exception("PROBE:...")`: it returns the validation messages without saving. Fix every error, then run it again without the throw, and merge once at the end. Read the screen or module before editing, since the user may have changed it in Service Studio.
- **Identify O11 modules by name and contents, not by the key `listApps` reports**; the same module's key changed after a Service Studio restart. After a restart, request a new session token (the old one is rejected) and, if the tools are missing, ask the user to reconnect `servicestudio` from `/mcp`. See Components_11.md, "Working with the Service Studio MCP".

## Writing docs

- The guides record what was **measured**. Mark anything not run as not verified.
- Edit Markdown tables with the Edit tool, one table at a time. A broad `sed` on `|---|` lines rewrote the wrong table once.
- Don't assume Python is available (it isn't on the main development machine). Node is, since the build needs it; use it or the Edit tool for scripted edits.
- Keep server hostnames, module keys and URLs out of committed docs; use placeholders such as `<server>` and `<App>`.
