# Working in this repo

Custom front-end patterns for OutSystems, built in TypeScript and shipped into an app as a Block that bridges to the bundle. [Components.md](Components.md) holds what's shared (the idea, the rules, steps 1 to 5); steps 6 to 8 are per platform: ODC ([Components_ODC.md](Components_ODC.md)) and O11 Reactive ([Components_11.md](Components_11.md)). Put platform-neutral content in Components.md, never in a platform guide. [README.md](README.md) has the overview.

## Standing rules

- **[Style.md](Style.md) governs all pattern CSS.** BEM under the pattern block is the golden rule (Rule 0). Every visual value is an OutSystems UI variable whose fallback is its exact base-theme value. Read Style.md before writing or reviewing any CSS.
- **[AppGuidelines.md](AppGuidelines.md) governs app screens.** Read it before creating or changing a screen; new screens use `Layouts\LayoutTopMenu`, not `LayoutBlank` (Rule 1), and are created in the `MainFlow` UI flow (Rule 2).
- **`greeting-card/` is an example**, not the product. New patterns are copies of it (use the `new-pattern` skill). Don't add features to it unless asked.
- **`npm test` must be green** (in the pattern's folder) before anything goes to OutSystems. When a test fails, fix the code, never the test, unless the rule itself changed in Style.md.
- **Every new Style.md rule that a script can check gets a check** in `test/checks.js`. Add a variable you start using to `OSUI_TOKENS` with its base-theme value.
- **`dist/` is committed.** It's what goes to OutSystems; rebuild it with `npm test`, never edit it by hand.
- **`dist/components.js` (from `npm run build:all`) is committed only when it's uploaded.** Every build writes a new timestamp, so commit the exact file that went to OutSystems, together with where it went, and leave other builds uncommitted.
- **Line endings are LF** (`.gitattributes`). Keep bundles ASCII-only, since non-ASCII content has come back altered from a publish.

## OutSystems actions

- **Never publish, deploy, create an app or change a Script without the user asking** in the current request. Reading (app lists, `env_app`, context lookups, downloading published files) needs no confirmation.
- **To update a pattern on ODC, use the `publish-pattern-odc` skill.** It covers the Mentor prompt, publish, live-revision check and the byte-level diff.
- **O11 has not been run end to end.** Follow Components_11.md. When you run it, record what actually happened in the guide (and remove its "not yet run" status) before writing an O11 publish skill.
- **One Mentor turn does one thing**: one Script, or one Block, or one publish. Mentor quota is shared by the whole tenant.
- **A publish is confirmed only when** `env_app` shows the new revision **and** the published Script matches `dist/` after stripping the BOM ODC adds (it also drops the final newline).
- **On O11, dry-run every Model API edit first.** Run the lambda once ending in `throw new Exception("PROBE:...")`: it returns the validation messages without saving. Fix every error, then run it again without the throw, and merge once at the end. Read the screen or module before editing, since the user may have changed it in Service Studio.
- **Identify O11 modules by name and contents, not by the key `listApps` reports**; the same module's key changed after a Service Studio restart. After a restart, request a new session token (the old one is rejected) and, if the tools are missing, ask the user to reconnect `servicestudio` from `/mcp`. See Components_11.md, "Working with the Service Studio MCP".

## Writing docs

- The guides record what was **measured**. Mark anything not run as not verified.
- Edit Markdown tables with the Edit tool, one table at a time. A broad `sed` on `|---|` lines rewrote the wrong table once.
- Don't assume Python is available (it isn't on the main development machine). Node is, since the build needs it; use it or the Edit tool for scripted edits.
- Keep tenant hostnames, app keys and URLs out of committed docs; use placeholders such as `<your-app-url>`.
