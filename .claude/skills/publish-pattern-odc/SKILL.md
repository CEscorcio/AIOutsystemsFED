---
name: publish-pattern-odc
description: >-
  Update a custom pattern's Script in an ODC app and publish it, then prove the
  live app runs exactly the local bundle: npm test, one Mentor turn that
  replaces the Script verbatim, one publish turn, the env_app revision check, a
  byte-level diff of the published Script against dist/, and the guide's
  measurements table. Use when the user asks to republish, ship, deploy or
  update a pattern (e.g. GreetingCard) in ODC after changing its TypeScript or
  CSS. Not for O11 (see Components_11.md), and not for creating the Block or the
  harness screen the first time (Components_ODC.md, step 6).
---

# Publish a pattern's Script to ODC

Ships a rebuilt bundle into an ODC app that already has the pattern's Script, Block and harness screen. Only the Script changes; that's the normal case when you change the component's TypeScript or CSS without changing the contract in `types.ts`.

**If `types.ts` changed** (a new Input Parameter, Event or modifier that the Block must pass on), the Block has to change too. Stop and follow [Components_ODC.md](../../../docs/Components_ODC.md) step 6, turn B, for that part.

## Before anything: ask

Publishing changes tenant state and spends Mentor quota for the whole tenant. Do this only when the user asked to publish in the current request. Restate the app and the change if there's any doubt.

## 1. Gate locally

```bash
npm test -w components/<pattern>   # e.g. components/greeting-card; run at the repo root
git status --short           # dist/ must be rebuilt and committed with the source
```

All checks must pass. Commit source and `dist/` together before publishing, so the published Script corresponds to a commit.

## 2. Find the app and its live revision

Load the OutSystems tools (the `outsystems` skill, then `ToolSearch` for `app_list`, `env_list`, `env_app`, and the `mentor_*` tools).

1. `app_list` with `search` → the app's `assetKey`. Check `isExternal` is false: publishing an app installed from a sample/Forge fails.
2. `env_list` → the Development environment's `key`.
3. `env_app { env_key, key }` → note the current `revision` and the runtime `url`.
4. Optional but cheap: run step 6's script against the current bundle to see what's live before you change it.

## 3. Mentor turn A: replace the Script

```
mentor_start_session                → sessionId
mentor_load_asset { sessionId, assetKey }
mentor_prompt { sessionId, message } → runId
```

Paste the **whole** `dist/<Name>.js` between the markers. Read the file and copy it exactly; never retype it.

```text
Replace the entire content of the existing Script resource named "<Name>" (file <Name>.js) in this app. Its new content must be EXACTLY the JavaScript below, copied literally, character for character — do not reformat, reindent, translate, rename, minify or "improve" anything, and do not keep any of the old content. Only change this Script; do not change the <Name> Block, any screen, action or other element. Do not publish.

----- BEGIN <Name>.js -----
<contents of dist/<Name>.js>
----- END <Name>.js -----
```

Keep bundles small and ASCII-only. A ~106 KB file once killed a Mentor turn, and a 21 KB bundle came back reindented with an escape sequence changed. If the bundle is large, have the user paste it into ODC Studio instead.

## 4. Wait for the run, then read it

Don't use the `outsystems:status-watcher` agent here: it can't sleep between polls in this environment. Instead:

- `Bash` with `run_in_background: true`: `sleep 30; echo done`, then end your turn.
- When it completes, `mentor_get_run { sessionId, runId, cursor: 0 }`.
- Repeat while `status` is `working`. A Script turn takes about 20–60 s.

Done means `status: succeeded` **and** `result.changeApplied: true` **and** `result.validation.errorCount: 0`. Anything else: report it and stop. Don't publish.

## 5. Mentor turn B: publish

Same session:

```text
Publish. Publish note: "<one line: what changed, from the commit message>"
```

Poll the same way (60 s first wait; a publish takes about 1–1.5 min). Read the events:

- `publishAccepted` gives the new `revision` and `publicationKey`.
- `publishSucceeded` means the build finished.
- A conflict, a failure with an `OS-*` code, or a timeout: report it. **Never publish again on a timeout**; the first one may still land. Check with `publish_status { publication_key }` or `env_app`.

Then `mentor_close_session { sessionId }`.

## 6. Prove what's live

1. `env_app { env_key, key }` → `revision` must equal the revision from `publishAccepted`. A success message alone isn't proof.
2. Diff the published Script against the bundle:

   ```bash
   bash .claude/skills/publish-pattern-odc/verify-script.sh <url-from-env_app> <Name> components/<pattern>/dist/<Name>.js <scratchpad-dir>
   ```

   Exit 0 and `code: IDENTICAL, line for line` is the pass. Every publish so far: BOM added, final newline dropped, LF line endings. The script accounts for both. Exit 1 means the Script differs: show the diff to the user, and don't call the publish done.

## 7. Record and commit

Add a column to the measurements table in [Components_ODC.md](../../../docs/Components_ODC.md) step 8a ("What we measured on … publishes"): local bytes and lines, published bytes, BOM, final newline, line endings, code. Update the count in the sentence above the table.

- **Use the Edit tool on that one table.** Don't use `sed` on `|---|` lines: other tables in the file have the same separator, and one was broken that way once.
- Don't commit the tenant hostname or app key; the guide uses placeholders.

Commit with a message like `Guide: record the <change> publish measurements`. Push only if the user asked.

## Report to the user

- App name and asset key, environment, old → new revision.
- Mentor turns used (normally 2).
- The verify result (identical / different, BOM, final newline).
- The runtime URL as a markdown link, e.g. `[Open <App>](<url>)`.
- What you didn't check, e.g. that nobody has clicked through it in a browser yet.
