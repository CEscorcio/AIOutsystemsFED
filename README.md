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
2. Add `dist/components.js` to the module as a Script, and paste `dist/components.css` into the theme stylesheet
3. Commit both files together, with where they were uploaded

Commit them **only when they've been uploaded**: test builds don't use up version numbers, but a committed build does.

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

### Previewing a Component

Open `components/<name>/preview/index.html` in a browser to see the component with the real OutSystems UI stylesheet. Add `?test=1` to run its checks in the page.

### Creating a New Component

```bash
node .claude/skills/new-pattern/scaffold.mjs StatusBadge MyCompany
npm install
npm test -w components/status-badge
```

This copies `components/greeting-card/` and renames the class, BEM block, stylesheet, namespace and tests. The full walkthrough, from naming a component to proving it live in OutSystems, is [docs/NewComponent.md](docs/NewComponent.md). With Claude Code, ask: "create a StatusBadge component".

### Project Structure

```
AIOutsystemsFED/
├── components/                 # One folder per component (npm workspace)
│   └── greeting-card/          # The example new components are copied from
│       ├── src/                # TypeScript: contract (types.ts), class, registration
│       ├── style/              # The component's CSS
│       ├── test/               # Checks run in jsdom and in the browser
│       ├── preview/            # Local preview page
│       └── dist/               # Built GreetingCard.js and GreetingCard.css
├── docs/                       # Documentation
├── scripts/                    # build-all.mjs
├── dist/                       # components.js and components.css (versioned)
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
| [AGENTS.md](docs/AGENTS.md)               | Standing rules for an AI agent working in this repo                                       |

## Considerations

1. **OutSystems UI is the base theme.** Every colour, space, radius, shadow and font value in a component's CSS is an OutSystems UI variable, with its base-theme value as fallback. The `outsystems-ui` package is pinned to the version the O11 environment runs (2.30.0); the tests read its tokens, and the preview loads its stylesheet.
2. **Components never inject CSS.** Each component's styles live in `style/<name>.css` and ship as a stylesheet of their own, in the module's theme stylesheet. Don't use the Block's stylesheet: edits to it don't reliably publish through the agent.
3. **The JS bundle isn't minified on purpose,** so the copy OutSystems serves can be compared with `dist/` line for line. Keep bundles ASCII-only.
4. **Class names are BEM** under the component's block (`greeting-card__title`, `greeting-card--compact`). stylelint enforces it, together with the other rules in [Style.md](docs/Style.md).

## Limitations

1. **The OutSystems side hasn't been run end to end yet** for a component (Script, stylesheet, Block and publish through Service Studio). [Components_11.md](docs/Components_11.md) marks those steps as not verified; record what happens the first time.
2. **The preview page can't run the CSS checks.** A page opened from `file://` can't read a stylesheet's text, so those checks show as skipped there; `npm test` runs them.
3. **Prettier prints a warning on every run** about the `css` / `scss` `remove_blank_lines` entries in `.prettierrc.json`. They aren't Prettier options and are ignored.
4. **`npm audit` reports a "high" advisory in `braces`,** a dependency of stylelint. No fixed version exists, and it only applies to malicious file patterns, which this repo doesn't have.
5. **The example ships too.** `dist/components.js` and `.css` include every folder in `components/`, `greeting-card` included, until it's removed or moved.

## Next Steps

1. Run the first component end to end in OutSystems 11 and record the results in [Components_11.md](docs/Components_11.md)
2. Replace or move the `greeting-card` example once real components exist
3. Evaluate SCSS for component styles
4. Evaluate automated release notes on commit

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
