# How to

Short recipes for the things you do in this factory, each a few steps long, with a link to the guide that explains it. If you're new, read [Set up your machine](#set-up-your-machine) and [Create a component](#create-a-component) first; the rest you'll look up when you need it.

**Contents**

- Getting started: [Set up your machine](#set-up-your-machine) · [Start a new project from the blueprint](#start-a-new-project-from-the-blueprint)
- Components: [Create a component](#create-a-component) · [Change a component](#change-a-component) · [Preview a component](#preview-a-component)
- Checks: [Run the checks](#run-the-checks) · [Fix a failing check](#fix-a-failing-check)
- Releasing: [Release to OutSystems 11](#release-to-outsystems-11) · [Record another deployment](#record-another-deployment)
- Team work: [Work with AI tools](#work-with-ai-tools) · [Open and review a pull request](#open-and-review-a-pull-request) · [Update dependencies](#update-dependencies) · [Change the OutSystems UI version](#change-the-outsystems-ui-version)
- [When something goes wrong](#when-something-goes-wrong) · [Command cheat sheet](#command-cheat-sheet)

---

## Set up your machine

1. Install **Node.js 22** (the repo's `.nvmrc`; at least 20), **Git** (with Git Bash on Windows) and **VS Code**.
2. Clone the repo and install:
   ```bash
   git clone <repository-url>
   cd <folder>
   npm install
   ```
   `npm install` also installs the git hook that writes release notes and checks release records.
3. Open the folder in VS Code and accept the recommended extensions: ESLint, stylelint, Prettier, GitHub Copilot.
4. Check it works: `npm test`. No OutSystems environment is needed for this.
5. **Only for the OutSystems side:** Service Studio 11 with its **MCP Server** enabled, on Windows. Claude Code and Copilot in VS Code find it through `.mcp.json` and ask you to approve it the first time.

No Windows machine or no Service Studio? Open the repo in **Codespaces** (`.devcontainer/`): everything except the OutSystems side works there.

More: [AITools.md, "Setting up a machine"](AITools.md#setting-up-a-machine).

## Start a new project from the blueprint

1. On GitHub, **Use this template** on the blueprint repository, then clone your copy and `npm install`.
2. See what `init` would change, then do it:
   ```bash
   npm run init -- --project AcmePortal --namespace Acme --outsystems-ui 2.30.0 --theme AcmeTheme
   npm run init -- --project AcmePortal --namespace Acme --outsystems-ui 2.30.0 --theme AcmeTheme --yes
   ```
   - `--namespace`: the global every component registers on (`window.Acme.<Component>`). Choose it once.
   - `--outsystems-ui`: the version your OutSystems 11 environment runs (its `OutSystemsUI.css` header says).
   - `--theme`: the app theme whose stylesheet will hold the components' CSS.
3. `npm install && npm test`, then commit: `git add -A && git commit -m "Start AcmePortal from the blueprint"`.

`init` empties what belonged to the previous project (components, releases, change log, project records) and keeps the guide, the tooling and the template. More: the README, [Starting a New Project](../../README.md#starting-a-new-project).

---

## Create a component

1. **Agree the contract first.** In Copilot Chat, `/design-contract` with a description proposes the names, `component.json` and `types.ts`. Or write them yourself.
2. **Scaffold** it from the template (the namespace comes from `factory.config.json`):
   ```bash
   node .claude/skills/new-pattern/scaffold.mjs StatusBadge
   npm install
   npm test -w components/status-badge
   ```
   The copy must pass before you change anything. With Copilot, `/new-component` does steps 2 to 6; with Claude Code, ask "create a StatusBadge component".
3. **Write the contract:** `component.json` and `src/status-badge/types.ts` together. Then `npm run docs:components` writes the component's `README.md` from it.
4. **Write the class** in `src/status-badge/StatusBadge.ts`: three public members (constructor, `onParametersChanged`, `destroy`), data into the DOM through `textContent` only.
5. **Write the styles** in `style/status-badge.scss`, following [Style.md](Style.md): BEM classes, OutSystems UI variables with their base-theme fallbacks.
6. **Rewrite the behaviour checks** in `test/checks.js` (the structural checks every component passes are shared, in `packages/toolchain/`) and the preview page.
7. `npm test` at the repo root, then open a pull request.

More: [NewComponent.md](NewComponent.md), the full step-by-step.

## Change a component

1. Change the code, styles or contract. If the contract changes, change `component.json` **and** `types.ts` together, then run `npm run docs:components`.
2. Ask whether it's **breaking** for screens that use the Block: an input, event or modifier removed, a type or an event's parameters changed, a new mandatory input, an input made mandatory. If so, say so in the commit and the pull request; the next release record flags it too.
3. `npm test`, then a pull request.

## Preview a component

Open `components/<name>/preview/index.html` in a browser. It loads the real OutSystems UI stylesheet, so it looks like an unthemed app. Add `?test=1` to the address to run the component's checks in the page; the CSS checks show as skipped there, because a page opened from disk can't read stylesheets (`npm test` runs them).

---

## Run the checks

```bash
npm test                               # everything below, in order
npm test -w components/status-badge    # one component: typecheck, build, its checks
```

What `npm test` runs:

| Step | Checks |
|---|---|
| ESLint | The TypeScript and scripts, including the ban on `innerHTML` and `eval` in components |
| `check-links` | Every relative link and `#anchor` in the Markdown resolves |
| stylelint | BEM class names and the other [Style.md](Style.md) rules, in the SCSS source |
| Prettier | Formatting (`npm run format` fixes it) |
| Each component's tests | Typecheck, build, then its checks in jsdom: behaviour, BEM, OutSystems UI tokens and fallbacks, no injected CSS, destroy safety |
| `check-contracts` | `factory.config.json` is valid; each `component.json` agrees with `types.ts`, `index.ts` and the compiled CSS; each component README is current |

CI also runs `npm run check:audit` (dependency advisories) and `npm run test:blueprint` (a new project made from the repo reaches its first release).

## Fix a failing check

| Message | What to do |
|---|---|
| `Code style issues found` | `npm run format` |
| `Class names are BEM …` (stylelint) | Rename the class to `<block>__<element>` or `<block>--<modifier>`, lowercase |
| `every selector is one BEM class …` | Keep each selector to one BEM class, prefixed at most by a modifier or `.phone` / `.tablet` / `.is-rtl` … ([Style.md](Style.md), Rule 3) |
| `every variable is an OutSystems UI token with its base-theme fallback` | Use a real OutSystems UI variable, with the fallback from [Style.md](Style.md)'s table: `var(--space-base, 16px)` |
| `'innerHTML' is restricted …` | Create elements and set `textContent` instead |
| `… Parameters has no "x" (input X in component.json)` | Make `types.ts` and `component.json` agree |
| `the CSS styles <block>--x, which isn't in component.json's modifiers` | Add the modifier to `component.json`, or remove it from the styles |
| `README.md doesn't match component.json` | `npm run docs:components` (never edit it by hand) |
| `check-links: … (no such file)` | Fix the link; files moved recently are the usual cause |
| `package.json pins outsystems-ui to …` | See [Change the OutSystems UI version](#change-the-outsystems-ui-version) |
| `A component's dist/ doesn't match its source` (CI) | `npm test` locally, then commit the rebuilt `components/*/dist/` |
| `high or critical advisories not accepted` (CI) | Update the dependency; if it truly doesn't apply, accept it in `scripts/check-audit.mjs` with the reason |

---

## Release to OutSystems 11

A release is one Script (`dist/components.js`) and one stylesheet section (`dist/components.css`), built together and stamped `Version: <year>.<week>.<N>`. With Copilot, `/release` walks you through it; with Claude Code, ask for it. The steps:

1. **Build it** just before uploading (it runs every check first):
   ```bash
   npm run build:all
   npm run release-notes      # what's in it, compared with the last release
   ```
2. **Generate the OutSystems side.** These write Model API lambdas to `platform/o11/out/`, each with a probe and the values it must report:
   ```bash
   npm run o11:generate -- script
   npm run o11:generate -- theme
   npm run o11:generate -- block status-badge      # only for a new component
   npm run o11:generate -- harness status-badge    # a test screen for it
   npm run o11:generate -- showcase status-badge   # or an example screen, if component.json has a showcase
   ```
3. **Apply them in Service Studio** (Windows, MCP Server on, the module open), with Claude Code or Copilot agent mode. Each lambda is dry-run first, then applied and merged, and you review each merge. Follow [Components_11.md](Components_11.md#generated-lambdas).
4. **Publish** (1-Click Publish, or ask the agent; it only publishes when asked), then **check what's live** against `dist/`: the Script, the theme section and the compiled Blocks ([Components_11.md, step 8](Components_11.md#step-8-verify-what-was-actually-published)):
   ```bash
   npm run o11:verify -- --app https://<server>/<App>    # don't commit the URL
   ```
   It allows for the BOM the platform adds to the Script and the CRLF line endings in the theme ([PlatformNotes.md](PlatformNotes.md)).
5. **Record it** in `releases/<version>.json`:
   ```bash
   npm run release:record -- --description "StatusBadge, first version" \
     --environment dev --module AcmePortal --theme AcmeTheme \
     --verified "Script and theme section identical to dist/; Block checked"
   ```
   The environment is a label (`dev`, `test`, `prod`), never a hostname.
6. **Commit** the release:
   ```bash
   git add dist/components.js dist/components.css releases/
   git commit -m "Release <version>: StatusBadge, uploaded to dev / AcmePortal"
   ```
   The hook adds the `CHANGELOG.md` entry and regenerates [docs/project/Releases.md](../project/Releases.md). It refuses a release commit without its record.

Only commit a build that was uploaded: a committed build uses up a version number. To experiment, build with `npm run build:all -- --no-test` and don't commit it.

## Record another deployment

When an already-recorded release reaches another environment or module, add it to the same record, then commit:

```bash
npm run release:record -- --environment prod --module AcmePortal --theme AcmeTheme --verified "<what you checked>"
git add releases/ docs/project/Releases.md
git commit -m "Record <version> deployed to prod / AcmePortal"
```

The command refuses if `dist/` no longer holds that release's exact files.

---

## Work with AI tools

Every tool follows one set of rules, [AGENTS.md](../../AGENTS.md). Which file each tool reads: [AITools.md](AITools.md).

| To | In Copilot Chat | In Claude Code |
|---|---|---|
| Propose a new component's contract | `/design-contract` | "design the contract for …" |
| Create a component | `/new-component` | "create a StatusBadge component" |
| Review a component's styles | `/review-style` | "review the styles of …" |
| Prepare and record a release | `/release` | "prepare a release" |
| Record an architecture decision | `/adr` | "record the decision that …" |

Things to know:

- **Agents generate the OutSystems side; they don't write it.** They run `npm run o11:generate` and pass the files unchanged to Service Studio.
- **Only a machine with Service Studio open can change OutSystems.** A cloud agent (the Copilot coding agent, Codespaces) prepares the change and says what's left.
- **Agents never publish, merge to a module, or change a Script or stylesheet unless you ask** in that request.
- After Service Studio restarts, reconnect it: `/mcp` → `servicestudio` → Reconnect (Claude Code).

## Open and review a pull request

1. Branch, commit, push, open the pull request. The template's **Definition of Done** is the checklist: tick it honestly.
2. CI (`npm test`, the dist check, the audit, the blueprint test) and CodeQL must be green.
3. As a reviewer, follow [.github/copilot-instructions.md, "Reviewing a pull request"](../../.github/copilot-instructions.md#reviewing-a-pull-request); Copilot code review uses the same list. Look hardest at contract changes (breaking or not) and anything touching the factory (`scripts/`, `platform/`, `.github/`).

## Update dependencies

Dependabot opens grouped pull requests weekly (lint tools, build tools, GitHub Actions). Merge one when its CI is green: the dist check proves the build output didn't change. Then `git pull && npm install`.

`outsystems-ui` is excluded on purpose; it follows your environment (next recipe).

## Change the OutSystems UI version

When the OutSystems 11 environment upgrades OutSystems UI:

1. Read the new version from the app's `OutSystemsUI.css` header.
2. Change both, together:
   ```bash
   npm install -D --save-exact outsystems-ui@<version>
   ```
   and `"outsystemsUi": "<version>"` in `factory.config.json`.
3. `npm test`. The token checks now compare every fallback with the new version's values; fix any that changed, and update [Style.md](Style.md)'s table.

---

## When something goes wrong

| Problem | What to do |
|---|---|
| The agent's Service Studio tools are missing | Open Service Studio with its MCP Server on, then `/mcp` → `servicestudio` → Reconnect |
| "requires a valid session token" | Service Studio restarted; the agent requests a new token (approve it in Service Studio) |
| Publish returns `blocked` | Allow "automatic merge and publish" in Service Studio's MCP Server dialog, or publish from Service Studio yourself |
| `InvalidIconLibrary` after a theme edit | A false positive of the agent's validator; Service Studio's own validation and the publish pass. Don't set the icon library |
| The published Script differs from `dist/` | A leading BOM is expected; anything else is a finding. Strip the BOM and diff again ([PlatformNotes.md](PlatformNotes.md)) |
| The hook refuses your commit: `stage releases/<version>.json` | Record the release first (`npm run release:record`), then `git add releases/` |
| The hook refuses: `isn't from the same build` | Stage `dist/components.js` and `dist/components.css` from the same `npm run build:all` |
| `build:all`: `nothing to release` | `components/` has no component yet; `templates/` never ships |
| A component works in the preview but not in OutSystems | Check the Block's Required Scripts includes the release Script, the theme section is present, and the console shows `window.<Namespace>.<Class>` |

## Command cheat sheet

| Command | What it does |
|---|---|
| `npm test` | Lint, build and test every component, check the contracts |
| `npm test -w components/<name>` | Build and test one component |
| `npm run format` | Fix formatting and auto-fixable lint |
| `npm run docs:components` | Regenerate component READMEs from `component.json` |
| `npm run build:all` | Build the versioned release in `dist/` (runs every check first) |
| `npm run release-notes` | What the build in `dist/` contains |
| `npm run o11:generate -- <script \| theme \| block <c> \| harness <c> \| showcase <c>>` | Write the Model API lambdas for Service Studio |
| `npm run o11:verify -- --app https://<server>/<App>` | Check what a published app serves against `dist/` |
| `npm run release:record -- …` | Record a release or a deployment |
| `npm run check:contracts` | Check every contract against its code |
| `npm run check:audit` | Check dependency advisories |
| `npm run test:blueprint` | Make a new project from this repo and take it to a first release |
| `npm run init -- …` | Set up a new project made from the blueprint |
