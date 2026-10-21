# AIOutsystemsFED

A UI component library for **OutSystems 11** (Reactive Web), built with TypeScript and CSS, and shipped into OutSystems with an AI agent doing the platform work through Service Studio.

Each component is ordinary front-end code, reviewed and tested in Git. In OutSystems it becomes a thin **Block** that receives Input Parameters, raises Events, and drives the component's class from its `OnReady`, `OnParametersChanged` and `OnDestroy` handlers.

## Quick Start

### Prerequisites

- **Node.js** v20 or higher (LTS recommended)
- **Git** with Bash (Git Bash on Windows)
- **npm** (comes with Node.js)
- **VS Code** (recommended): opening the repo suggests the ESLint, stylelint and Prettier extensions, and formats on save
- For the OutSystems side only: **Service Studio 11** with its MCP Server enabled, and **Claude Code** connected to it

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
 *   components/greeting-card/dist/GreetingCard.js
 */
```

The version is `<year>.<week>.<N>`:

- **year** and **week** follow ISO 8601 and the build's UTC date: weeks start on Monday, and the week's Thursday decides its year (31 Dec 2029 is `2030.1.N`). No zero padding.
- **N** counts committed releases within that week: one more than the version in the last committed `dist/components.js` if that's from the same week, otherwise 1.

### Releasing

1. Run `npm run build:all` just before uploading
2. Put it in the module: `npm run o11:generate -- script` and `npm run o11:generate -- theme --theme <Theme>` write the Model API lambdas for the Script and the theme stylesheet section (see [Generating the OutSystems side](#generating-the-outsystems-side))
3. Publish, and check the served files against `dist/` ([Components_11.md, step 8](docs/Components_11.md#step-8-verify-what-was-actually-published))
4. Record it: `npm run release:record -- --description "<what it's for>" --environment <label> --module <Module> --theme <Theme> --verified "<what you checked>"`
5. Commit `dist/components.js`, `dist/components.css` and `releases/`, with where they were uploaded

Commit them **only when they've been uploaded**: test builds don't use up version numbers, but a committed build does.

### Release Records

Every release has a data file, `releases/<version>.json`, written by `npm run release:record`:

- what it contains: both files and each component's section, with sha256 hashes, and each component's contract (inputs, events, modifiers)
- a description written by whoever released it
- the contract changes since the previous release, each marked **breaking** when a screen using the Block could stop compiling or lose a style (an input or event removed, a type changed, a new mandatory input)
- every deployment: platform, environment label, module, Script, theme, date and how the served files were checked

[docs/Releases.md](docs/Releases.md) is generated from these files. Run `release:record` again for a release that's already recorded to add a deployment, for example when it reaches another environment. Environment labels are names like `dev` or `prod`, never hostnames.

The pre-commit hook refuses a release commit that doesn't include its record, or whose record was made for other files, and regenerates `docs/Releases.md` into the commit.

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
| `npm test -w components/greeting-card` | Build and test one component                                                       |
| `npm run lint`                         | ESLint, stylelint and a Prettier check                                             |
| `npm run format`                       | Prettier, then stylelint and ESLint auto-fixes                                     |
| `npm run build:all`                    | Lint, test, and write the versioned `dist/components.js` and `dist/components.css` |
| `npm run release-notes`                | Print the release notes for the build in `dist/`                                   |
| `npm run release:record`               | Record the release in `dist/` in `releases/<version>.json` and `docs/Releases.md`  |
| `npm run check:contracts`              | Check every `component.json` against its code (also part of `npm test`)            |
| `npm run o11:generate`                 | Write the Model API lambdas for the Script, theme section, a Block or a harness    |

### Previewing a Component

Open `components/<name>/preview/index.html` in a browser to see the component with the real OutSystems UI stylesheet. Add `?test=1` to run its checks in the page.

### Creating a New Component

```bash
node .claude/skills/new-pattern/scaffold.mjs StatusBadge MyCompany
npm install
npm test -w components/status-badge
```

This copies `components/greeting-card/` and renames the class, BEM block, stylesheet, namespace and tests. The full walkthrough, from naming a component to proving it live in OutSystems, is [docs/NewComponent.md](docs/NewComponent.md). With Claude Code, ask: "create a StatusBadge component".

### Generating the OutSystems side

The Block, its harness screen, the Script and the theme stylesheet section are generated, not typed. `platform/o11/generate.mjs` reads a component's `component.json` and the files in `dist/`, and writes Model API lambdas to `platform/o11/out/` for the Service Studio MCP:

```bash
npm run o11:generate -- script                       # Script "Components" from dist/components.js, created or replaced
npm run o11:generate -- theme --theme Sandbox        # the components section of the theme stylesheet, appended or replaced
npm run o11:generate -- block greeting-card          # the Block, from component.json
npm run o11:generate -- harness greeting-card        # a test screen that drives every input and shows every event
```

Each command writes the lambda and a probe, and prints what the probe must report (lengths, checksums, names), so what lands in the module is checked against the repo before it's merged. [Components_11.md](docs/Components_11.md#generated-lambdas) has the order. The Block generator only creates Blocks: changing an existing Block's contract is still done by hand in Service Studio.

### Project Structure

```
AIOutsystemsFED/
├── components/                 # One folder per component (npm workspace)
│   └── greeting-card/          # The example new components are copied from
│       ├── component.json      # The contract as data: inputs, events, modifiers
│       ├── src/                # TypeScript: contract (types.ts), class, registration
│       ├── style/              # The component's styles (SCSS)
│       ├── test/               # Checks run in jsdom and in the browser
│       ├── preview/            # Local preview page
│       └── dist/               # Built GreetingCard.js and GreetingCard.css
├── platform/o11/               # Generators: component.json + dist/ -> Model API lambdas (out/ not committed)
├── docs/                       # Documentation; Releases.md is generated
├── scripts/                    # build-all, check-contracts, release-notes, release-record, install-hooks; lib/
├── dist/                       # components.js and components.css (versioned)
├── releases/                   # One record per release: contents, hashes, contracts, deployments
├── CHANGELOG.md                # Release notes, one section per committed version
├── .githooks/                  # pre-commit: adds release notes to CHANGELOG.md
├── .claude/skills/new-pattern/ # Scaffold for new components
└── .vscode/                    # Recommended extensions, format on save
```

### Documentation

| Document                                  | What it covers                                                                            |
| ----------------------------------------- | ----------------------------------------------------------------------------------------- |
| [NewComponent.md](docs/NewComponent.md)   | Step-by-step checklist for building a new component                                       |
| [Components.md](docs/Components.md)       | The idea, the rules every component follows, and steps 1 to 5 (everything in the repo)    |
| [Components_11.md](docs/Components_11.md) | Steps 6 to 8 in OutSystems 11: Script, stylesheet, Block, harness screen, publish, verify |
| [Style.md](docs/Style.md)                 | The CSS rules: BEM class names (the golden rule), OutSystems UI variables, selectors      |
| [AppGuidelines.md](docs/AppGuidelines.md) | Rules for app screens: layout, UI flow, OutSystems UI classes, naming                     |
| [Releases.md](docs/Releases.md)           | Every release: contents, contract changes, deployments (generated)                       |
| [AGENTS.md](docs/AGENTS.md)               | Standing rules for an AI agent working in this repo                                       |

## Considerations

1. **OutSystems UI is the base theme.** Every colour, space, radius, shadow and font value in a component's CSS is an OutSystems UI variable, with its base-theme value as fallback. The `outsystems-ui` package is pinned to the version the O11 environment runs (2.30.0); the tests read its tokens, and the preview loads its stylesheet.
2. **Components never inject CSS.** Each component's styles live in `style/<name>.scss` and ship as a stylesheet of their own, in the module's theme stylesheet. Don't use the Block's stylesheet: edits to it don't reliably publish through the agent.
3. **The JS bundle isn't minified on purpose,** so the copy OutSystems serves can be compared with `dist/` line for line. Keep bundles ASCII-only.
4. **Class names are BEM** under the component's block (`greeting-card__title`, `greeting-card--compact`). stylelint enforces it, together with the other rules in [Style.md](docs/Style.md).
5. **Styles are SCSS, compiled to plain CSS.** Each component's build compiles `style/*.scss` with Dart Sass and formats it with Prettier, so `dist/<Name>.css` reads like hand-written CSS (converting `greeting-card` produced a byte-identical file). SCSS only groups a block's rules: visual values stay OutSystems UI variables, never Sass variables, and `@extend` is not allowed ([Style.md, Rule 8](docs/Style.md#rule-8-scss-grouping-not-values)).

## Limitations

1. **The OutSystems side has been run once**, for GreetingCard on 2026-10-21: Script, stylesheet, Block and harness through Service Studio, published, and the served files compared with `dist/` ([Components_11.md, First run](docs/Components_11.md#first-run-2026-10-21)). The browser click-through (step 8c) hasn't been done yet, and a library module plus consumer app hasn't been tried.
2. **The preview page can't run the CSS checks.** A page opened from `file://` can't read a stylesheet's text, so those checks show as skipped there; `npm test` runs them.
3. **stylelint can't check nested BEM names** (`&__title`) in SCSS. `npm test` catches them in the compiled CSS instead.
4. **Prettier prints a warning on every run** about the `css` / `scss` `remove_blank_lines` entries in `.prettierrc.json`. They aren't Prettier options and are ignored.
5. **`npm audit` reports a "high" advisory in `braces`,** a dependency of stylelint. No fixed version exists, and it only applies to malicious file patterns, which this repo doesn't have.
6. **The example ships too.** `dist/components.js` and `.css` include every folder in `components/`, `greeting-card` included, until it's removed or moved.

## Next Steps

1. Do the browser click-through (step 8c) on the Sandbox `GreetingCardTest` screen and record it in [Components_11.md](docs/Components_11.md)
2. Run the generators against Service Studio once (dry runs) and record the result, then write a publish skill on top of them
3. Replace or move the `greeting-card` example once real components exist

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

## Credits

The Block-as-bridge technique comes from [_AI-Powered Frontend Development in OutSystems O11 and ODC_](https://antonio-carvalho.medium.com/ai-powered-frontend-development-in-outsystems-o11-and-odc-4d408fdb4ade) by António Carvalho. The example reuses OutSystems UI class names and variables (BSD-3-Clause) and copies none of its code.
