# AIOutsystemsFED

A UI component library for **OutSystems 11** (Reactive Web), built with TypeScript and CSS, and shipped into OutSystems with an AI agent doing the platform work through Service Studio.

Each component is ordinary front-end code, reviewed and tested in Git. In OutSystems it becomes a thin **Block** that receives Input Parameters, raises Events, and drives the component's class from its `OnReady`, `OnParametersChanged` and `OnDestroy` handlers.

The repository is also a **blueprint**: a new project starts as a copy of it, set up with one command (see [Starting a New Project](#starting-a-new-project)).

## Quick Start

### Prerequisites

- **Node.js** 22 (`.nvmrc`; at least 20)
- **Git** with Bash (Git Bash on Windows)
- **npm** (comes with Node.js)
- **VS Code** (recommended): opening the repo suggests the ESLint, stylelint, Prettier and GitHub Copilot extensions, and formats on save. Or open it in **Codespaces** (`.devcontainer/`)
- For the OutSystems side only: **Service Studio 11** with its MCP Server enabled, and an agent connected to it (Claude Code or Copilot in VS Code; both read `.mcp.json`)

The AI tools (Copilot, Claude Code and others) share one set of rules, [AGENTS.md](AGENTS.md); [docs/guide/AITools.md](docs/guide/AITools.md) maps which file each tool reads and what can run where.

### Clone the repository

```bash
git clone <repository-url> AIOutsystemsFED
cd AIOutsystemsFED
```

### Install dependencies

```bash
npm install
```

One install at the root serves every component: the components are npm workspaces.

### Check everything works

```bash
npm test
```

This lints the whole repo (ESLint, stylelint, Prettier), then builds and tests every component. No OutSystems environment is needed.

---

## Starting a New Project

This repository is a blueprint. Everything that differs between projects is in `factory.config.json`:

```jsonc
{
  "project": "AIOutsystemsFED",      // README title, header of the combined files
  "namespace": "AIOutsystemsFED",    // the build registers every class as window.<namespace>.<Class>
  "outsystemsUi": "2.30.0",          // the version your O11 environment runs; must match the outsystems-ui pin
  "o11": { "script": "Components", "theme": "Sandbox", "flow": "MainFlow", "blockFlow": "Patterns", "layout": "LayoutTopMenu", "harnessRole": "Registered" },
  "budgets": { "releaseJsKB": 100, "releaseCssKB": 50 }  // build:all fails over them
}
```

To start a project:

1. On GitHub, **Use this template** (or copy the repository), and clone the copy
2. `npm install`
3. `npm run init -- --project <Name> --namespace <Namespace> --outsystems-ui <version> --theme <Theme>`. Without `--yes` it prints what it would do; with `--yes` it does it, on a clean working tree
4. `npm install && npm test`, then commit

`init` writes the config and the package name, and empties what belonged to the previous project: `components/`, `releases/`, `dist/components.*`, `CHANGELOG.md` and `docs/project/`. The guide (`docs/guide/`), the tooling and `templates/` stay. Improvements to the guide or the tooling belong in the blueprint, so every project gets them.

---

## Versioned Builds

This repository builds every component into **one JavaScript file and one stylesheet**, each stamped with a version and a build timestamp.

### How It Works

1. Run `npm run build:all`
2. It lints the repo and runs every component's tests, stopping at the first failure
3. It joins every component's bundle into `dist/components.js` and every component's stylesheet into `dist/components.css`
4. It smoke-tests both files (the JS loads and registers every component; the CSS styles every component and nothing outside them), and only then writes them

### Version Format

Both files start with the same header:

```css
/*!
 * Version: 2026.43.1
 * AIOutsystemsFED components
 * Built: 2026-10-21T10:15:33.196Z
 * Contains:
 *   components/status-badge/dist/StatusBadge.js
 */
```

The version is `<year>.<week>.<N>`:

- **year** and **week** follow ISO 8601 and the build's UTC date: weeks start on Monday, and the week's Thursday decides its year (31 Dec 2029 is `2030.1.N`). No zero padding.
- **N** counts committed releases within that week: one more than the version in the last committed `dist/components.js` if that's from the same week, otherwise 1.

### Releasing

1. Run `npm run build:all` just before uploading
2. Put it in the module: `npm run o11:generate -- script` and `npm run o11:generate -- theme --theme <Theme>` write the Model API lambdas for the Script and the theme stylesheet section (see [Generating the OutSystems side](#generating-the-outsystems-side))
3. Publish, and check the served files against `dist/` ([Components_11.md, step 8](docs/guide/Components_11.md#step-8-verify-what-was-actually-published))
4. Record it: `npm run release:record -- --description "<what it's for>" --environment <label> --module <Module> --theme <Theme> --verified "<what you checked>"`
5. Commit `dist/components.js`, `dist/components.css` and `releases/`, with where they were uploaded

Commit them **only when they've been uploaded**: test builds don't use up version numbers, but a committed build does.

### Release Records

Every release has a data file, `releases/<version>.json`, written by `npm run release:record`:

- what it contains: both files and each component's section, with sha256 hashes, and each component's contract (inputs, events, modifiers)
- a description written by whoever released it
- the contract changes since the previous release, each marked **breaking** when a screen using the Block could stop compiling or lose a style (an input or event removed, a type changed, a new mandatory input)
- every deployment: platform, environment label, module, Script, theme, date and how the served files were checked

[docs/project/Releases.md](docs/project/Releases.md) is generated from these files. Run `release:record` again for a release that's already recorded to add a deployment, for example when it reaches another environment. Environment labels are names like `dev` or `prod`, never hostnames.

The pre-commit hook refuses a release commit that doesn't include its record, or whose record was made for other files, and regenerates `docs/project/Releases.md` into the commit.

### Release Notes

Committing a new version adds its release notes to [CHANGELOG.md](CHANGELOG.md) in the same commit. A git pre-commit hook (`.githooks/pre-commit`, installed by `npm install`) runs `scripts/release-notes.mjs` whenever the staged `dist/components.js` has a version the last release didn't, and lists:

- each component that was added, removed or changed (JS, CSS), compared with the previous release's files
- the commits since the previous release, split into component commits and tooling and docs

The hook stops the commit if `dist/components.js` and `dist/components.css` aren't from the same build. Ordinary commits are left alone.

To see the notes for the build in `dist/` before committing it:

```bash
npm run release-notes
```

In a clone made before the hook existed, run `npm install` once to install it.

### Skipping the Tests

For local experiments only, never for something going to OutSystems:

```bash
npm run build:all -- --no-test
```

---

## Development

### Commands

| Command                                | What it does                                                                       |
| -------------------------------------- | ---------------------------------------------------------------------------------- |
| `npm test`                             | Lint everything, then typecheck, build and test every component                    |
| `npm test -w components/status-badge`  | Build and test one component                                                       |
| `npm run lint`                         | ESLint, stylelint and a Prettier check                                             |
| `npm run format`                       | Prettier, then stylelint and ESLint auto-fixes                                     |
| `npm run build:all`                    | Lint, test, and write the versioned `dist/components.js` and `dist/components.css` |
| `npm run release-notes`                | Print the release notes for the build in `dist/`                                   |
| `npm run release:record`               | Record the release in `dist/` in `releases/<version>.json` and `docs/project/Releases.md`  |
| `npm run check:contracts`              | Check every `component.json` against its code (also part of `npm test`)            |
| `npm run docs:components`              | Write each component's README.md from its `component.json`                        |
| `npm run check:audit`                  | Fail on any high or critical npm advisory not accepted in `scripts/check-audit.mjs` |
| `npm run test:blueprint`               | Make a new project from this repo in a temp folder and take it to its first release |
| `npm run o11:generate`                 | Write the Model API lambdas for the Script, theme section, a Block or a harness    |
| `npm run o11:verify`                   | After a publish, check what the app serves against `dist/` (`--app <url>`)         |

### Previewing a Component

Open `components/<name>/preview/index.html` in a browser to see the component with the real OutSystems UI stylesheet. Add `?test=1` to run its checks in the page.

### Creating a New Component

```bash
node .claude/skills/new-pattern/scaffold.mjs StatusBadge
npm install
npm test -w components/status-badge
```

This copies `templates/greeting-card/` into `components/status-badge/` and renames the class, BEM block, stylesheet, namespace and tests. The full walkthrough, from naming a component to proving it live in OutSystems, is [docs/guide/NewComponent.md](docs/guide/NewComponent.md). With Claude Code, ask: "create a StatusBadge component".

### Generating the OutSystems side

The Block, its harness screen, the Script and the theme stylesheet section are generated, not typed. `platform/o11/generate.mjs` reads a component's `component.json` and the files in `dist/`, and writes Model API lambdas to `platform/o11/out/` for the Service Studio MCP:

```bash
npm run o11:generate -- script                       # Script "Components" from dist/components.js, created or replaced
npm run o11:generate -- theme --theme Sandbox        # the components section of the theme stylesheet, appended or replaced
npm run o11:generate -- block status-badge           # the Block, from component.json
npm run o11:generate -- harness status-badge         # a test screen that drives every input and shows every event
npm run o11:generate -- showcase dropdown-button     # an example screen from component.json's "showcase"
```

Each command writes the lambda and a probe, and prints what the probe must report (lengths, checksums, names), so what lands in the module is checked against the repo before it's merged. [Components_11.md](docs/guide/Components_11.md#generated-lambdas) has the order. The Block generator only creates Blocks: changing an existing Block's contract is still done by hand in Service Studio.

After publishing, `npm run o11:verify -- --app https://<server>/<App>` downloads what the app serves and checks it against `dist/`: the Script, the theme section, and each component's Block and test screen. It only reads, and the URL stays on the command line.

### Project Structure

```
AIOutsystemsFED/
├── factory.config.json         # The project's settings: name, namespace, OutSystems UI version, O11 names
├── components/                 # One folder per component (npm workspace); everything here ships
│   └── <name>/
│       ├── component.json      # The contract as data: inputs, events, modifiers, placeholders
│       ├── src/                # TypeScript: contract (types.ts), class, registration
│       ├── style/              # The component's styles (SCSS)
│       ├── test/               # Checks run in jsdom and in the browser
│       ├── preview/            # Local preview page
│       └── dist/               # Built <Class>.js and <Class>.css
├── templates/greeting-card/    # The example new components are copied from; tested, never shipped
├── packages/toolchain/         # Builds and tests every component; the structural checks every component passes
├── platform/o11/               # Generators: component.json + dist/ -> Model API lambdas (out/ not committed)
├── scripts/                    # build-all, check-contracts, check-links, release-notes, release-record, init, install-hooks; lib/
├── dist/                       # components.js and components.css (versioned)
├── releases/                   # One record per release: contents, hashes, contracts, deployments
├── docs/
│   ├── guide/                  # How the factory works; the same in every project
│   ├── project/                # This project's records: Releases.md (generated), run logs
├── AGENTS.md                   # Standing rules for every AI agent (CLAUDE.md and Copilot point here)
├── CHANGELOG.md                # Release notes, one section per committed version
├── .githooks/                  # pre-commit: release notes, release record check
├── .github/                    # CI, CodeQL, Dependabot; Copilot instructions, prompts and setup steps
├── .devcontainer/              # Codespaces: everything except the OutSystems side
├── CLAUDE.md, .mcp.json        # Claude Code: imports AGENTS.md; the Service Studio MCP server (also read by VS Code)
├── SECURITY.md                 # Reporting problems, and what protects the code
├── .claude/skills/new-pattern/ # Scaffold for new components
└── .vscode/                    # Recommended extensions, format on save
```

### Documentation

For a quick answer to "how do I…", see [docs/guide/HowTo.md](docs/guide/HowTo.md). Start at [docs/README.md](docs/README.md): it lists every guide and what to read first, by role. The guide is [docs/guide/](docs/guide/); this project's records are in [docs/project/](docs/project/), with every release in [Releases.md](docs/project/Releases.md).

## Considerations

1. **OutSystems UI is the base theme.** Every colour, space, radius, shadow and font value in a component's CSS is an OutSystems UI variable, with its base-theme value as fallback. The `outsystems-ui` package is pinned to the version the O11 environment runs (`outsystemsUi` in `factory.config.json`; `npm test` checks they match); the tests read its tokens, and the preview loads its stylesheet.
2. **Components never inject CSS.** Each component's styles live in `style/<name>.scss` and ship as a stylesheet of their own, in the module's theme stylesheet. Don't use the Block's stylesheet: edits to it don't reliably publish through the agent.
3. **The JS bundle isn't minified on purpose,** so the copy OutSystems serves can be compared with `dist/` line for line. Keep bundles ASCII-only.
4. **Class names are BEM** under the component's block (`status-badge__label`, `status-badge--compact`). stylelint enforces it, together with the other rules in [Style.md](docs/guide/Style.md).
5. **Styles are SCSS, compiled to plain CSS.** Each component's build compiles `style/*.scss` with Dart Sass and formats it with Prettier, so `dist/<Name>.css` reads like hand-written CSS (converting the example from CSS produced a byte-identical file). SCSS only groups a block's rules: visual values stay OutSystems UI variables, never Sass variables, and `@extend` is not allowed ([Style.md, Rule 8](docs/guide/Style.md#rule-8-scss-grouping-not-values)).

## Limitations

1. **The OutSystems side has been run twice:** by hand on 2026-10-21, and from the generators on 2026-10-22 (six components). Both times the Script, stylesheet, Blocks and harness screens went in through Service Studio and were published, and the served files were compared with `dist/` ([PlatformNotes.md](docs/guide/PlatformNotes.md)). The browser click-through (step 8c) hasn't been done yet, and neither has a library module plus consumer app.
2. **The preview page can't run the CSS checks.** A page opened from `file://` can't read a stylesheet's text, so those checks show as skipped there; `npm test` runs them.
3. **stylelint can't check nested BEM names** (`&__title`) in SCSS. `npm test` catches them in the compiled CSS instead.
4. **Prettier prints a warning on every run** about the `css` / `scss` `remove_blank_lines` entries in `.prettierrc.json`. They aren't Prettier options and are ignored.
5. **`npm audit` reports a "high" advisory in `braces`,** a dependency of stylelint. No fixed version exists, and it only applies to malicious file patterns, which this repo doesn't have.

## Next Steps

For the blueprint (this project's own status and next steps are in [docs/project/README.md](docs/project/README.md)):

1. Write a publish skill on top of `o11:generate` and `o11:verify` (both run against Service Studio and a published app on 2026-10-22)
2. A pull request template with the Definition of Done, Playwright tests on the preview pages, generated per-component READMEs, and GitHub Releases with artifact attestations
3. Try the library module plus consumer app path in OutSystems 11
4. Extract the tooling into a versioned package once a second project uses the blueprint

## Notes

If you find any troubles with npm install, please check for outdated dependencies and update them and see the commands below.

```
npm outdated
```

Example:

1. Package - Current - Wanted - Latest - Location
2. lodash - 3.10.1 - 3.10.1 - 4.16.4 - backend

```
npm install lodash@latest
```

Keep `outsystems-ui` pinned to the version your OutSystems 11 environment runs, rather than updating it to the latest.

## Third-party code

The example reuses OutSystems UI class names and variables (BSD-3-Clause) and copies none of its code.
