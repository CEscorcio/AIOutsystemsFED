---
name: 'OutSystems 11 through Service Studio'
description: "Use when putting a release or a component into an OutSystems 11 module through Service Studio's MCP server: Script, theme stylesheet, Block, harness screen, publish, verify."
---

# OutSystems 11 through Service Studio

Follow [Components_11.md](../../docs/guide/Components_11.md); expect what [PlatformNotes.md](../../docs/guide/PlatformNotes.md) describes.

- Service Studio's MCP server runs on the developer's machine (`.mcp.json`, `http://127.0.0.1:41820/mcp`). It can only edit modules open in Service Studio. A cloud agent can't reach it: prepare everything else and say what's left.
- **Generate, don't write.** `npm run o11:generate -- script | theme | block <component> | harness <component>` writes each Model API lambda and a probe to `platform/o11/out/`. Pass the files to `applyModelApiCode` unchanged; run each probe and compare with the values the generator printed.
- Dry-run every edit first (the probe ends in a `throw`, so nothing is saved), one element per merge, and read the module before changing it.
- **Never publish, merge or change a Script or stylesheet without the user asking** in the current request. A publish is confirmed only when the files served from `/<App>/moduleservices/moduleinfo` match `dist/` and the release record: `npm run o11:verify -- --app https://<server>/<App>` checks it (don't commit the URL).
- Read each dry run's validation messages as well as the probe line; anything new there is about your change.
- After publishing, record the deployment: `npm run release:record -- --environment <label> --module <Module> ...`.
