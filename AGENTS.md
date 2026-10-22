# Working in this repo

Custom front-end patterns for **OutSystems 11** (Reactive Web), built in TypeScript and shipped into a module as a Block that bridges to the bundle. [Components.md](docs/guide/Components.md) covers the idea, the rules and steps 1 to 5 (everything done in the repo); [Components_11.md](docs/guide/Components_11.md) covers steps 6 to 8 in OutSystems 11 through Service Studio's MCP server. [README.md](README.md) has the overview. This repo targets O11 only; don't add ODC content.

Every AI tool reads this file, directly or through `CLAUDE.md` and `.github/copilot-instructions.md`; [docs/guide/AITools.md](docs/guide/AITools.md) says which reads what. Change the rules here, not in those files.

## Standing rules

- **[Style.md](docs/guide/Style.md) governs all pattern CSS.** BEM under the pattern block is the golden rule (Rule 0). Every visual value is an OutSystems UI variable whose fallback is its exact base-theme value. Read Style.md before writing or reviewing any CSS.
- **[AppGuidelines.md](docs/guide/AppGuidelines.md) governs app screens.** Read it before creating or changing a screen; new screens use `Layouts\LayoutTopMenu`, not `LayoutBlank` (Rule 1), and are created in the `MainFlow` UI flow (Rule 2).
- **New components follow [NewComponent.md](docs/guide/NewComponent.md)**, step by step; walk the user through it when they start one.
- **Components live in `components/<name>/`**, one npm workspace each; install once at the repo root. **`templates/greeting-card/` is the example**, not the product. New components are copies of it (use the `new-pattern` skill). Don't add features to it unless asked. `npm run build:all` ships every folder in `components/`; `templates/` never ships.
- **`npm test` must be green** (at the repo root for every component, or `npm test -w components/<name>` for one) before anything goes to OutSystems. When a test fails, fix the code, never the test, unless the rule itself changed in Style.md.
- **Every new Style.md rule that a script can check gets a check** in `packages/toolchain/structural-checks.js`, which every component runs. A component's `test/checks.js` holds only its own behaviour; components hold no build code (`packages/toolchain/` builds and tests them all).
- **Every visible string arrives through an input** (Components.md, Rule 3), with the English text as its default and `{placeholders}` for values, so screens can pass translations. No user-facing text is written in a component's class except those defaults.
- **The namespace lives only in `factory.config.json`.** The build registers every class as `window.<namespace>.<Class>`; component code just exports its class and never touches `window`. Base-theme values come from the installed `outsystems-ui` package; don't hand-copy them.
- **`dist/` is committed.** It's what goes to OutSystems; rebuild it with `npm test`, never edit it by hand.
- **A component's CSS is written in SCSS in `style/<name>.scss` and ships compiled as its own stylesheet** (`dist/<Name>.css`, in the app's theme stylesheet), never from the JavaScript. See Style.md, Rules 7 and 8. SCSS groups a block's rules; it never computes a visual value.
- **`dist/components.js` and `dist/components.css` (from `npm run build:all`) are committed only when they're uploaded.** Every build writes a new timestamp, so commit the exact files that went to OutSystems, together with where they went, and leave other builds uncommitted. Upload both from the same build. Their `Version: <ISO year>.<ISO week>.<N>` (UTC) takes N from the last committed `dist/components.js`, so committing a build that wasn't uploaded uses up a release number; never edit the version by hand. The pre-commit hook adds the release's notes to `CHANGELOG.md` in the same commit; don't skip it with `--no-verify`, and don't write release notes by hand.
- **Line endings are LF** (`.gitattributes`). Keep bundles ASCII-only, since non-ASCII content has come back altered from a publish.

## OutSystems actions

- **Never publish, merge, create a module or change a Script or stylesheet without the user asking** in the current request. Reading (listing modules, reading screens or actions, downloading published files) needs no confirmation.
- **Generate the OutSystems side; don't write it.** The Script, the theme section, a new Block and its harness come from `npm run o11:generate` (Components_11.md, "Generated lambdas"). Pass the generated files to `applyModelApiCode` unchanged, run each probe, and compare with the values the generator printed.
- **A release is recorded before it's committed**: `npm run release:record` writes `releases/<version>.json` with a description, the environment label (never a hostname), the module and what was verified. The hook refuses a release commit without it. Never edit a record's files or hashes by hand, and never edit `docs/project/Releases.md`; it's generated.
- **`component.json` is the contract.** Change it together with `types.ts` and the CSS; `npm test` checks they agree.
- **A component's platform side has been run twice**: by hand (2026-10-21), then entirely from the generators (2026-10-22). The browser check is still not done. In each dry run, read the validation messages as well as the probe line: anything new there is about your change. Follow Components_11.md; what the platform does to uploaded files and the Model API details it needs are in [PlatformNotes.md](docs/guide/PlatformNotes.md). Record anything new you measure there.
- **One request does one thing**: one Script, or one stylesheet section, or one Block, or one screen, each reviewed in its own Compare-and-Merge.
- **A publish is confirmed only when** Service Studio reports it done **and** the files the server serves (from `/<App>/moduleservices/moduleinfo`) match `dist/`: the Script, the theme's component section, and the compiled screen.
- **On O11, dry-run every Model API edit first.** Run the lambda once ending in `throw new Exception("PROBE:...")`: it returns the validation messages without saving. Fix every error, then run it again without the throw, and merge once at the end. Read the screen or module before editing, since the user may have changed it in Service Studio.
- **Identify O11 modules by name and contents, not by the key `listApps` reports**; the same module's key changed after a Service Studio restart. After a restart, request a new session token (the old one is rejected) and, if the tools are missing, ask the user to reconnect `servicestudio` from `/mcp`. See Components_11.md, "Working with the Service Studio MCP".

## Writing docs

- The guides record what was **measured**. Mark anything not run as not verified.
- Edit Markdown tables with the Edit tool, one table at a time. A broad `sed` on `|---|` lines rewrote the wrong table once.
- Don't assume Python is available (it isn't on the main development machine). Node is, since the build needs it; use it or the Edit tool for scripted edits.
- Keep server hostnames, module keys and URLs out of committed docs; use placeholders such as `<server>` and `<App>`.
