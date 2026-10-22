# Changelog

Release notes for `dist/components.js` and `dist/components.css`, newest first. The pre-commit hook adds a section when a commit includes a new version ([scripts/release-notes.mjs](scripts/release-notes.mjs)); the commit message says where the release was uploaded.

## 2026.43.2 (2026-10-22)

Built 2026-10-22T15:11:18.397Z. Previous release: 2026.43.1.

Size: dist/components.js 19.8 KB (+17.2 KB), dist/components.css 9.6 KB (+6.1 KB).

### Components

- **confirm-button**: added
- **copy-field**: added
- **greeting-card**: JS, CSS changed
- **read-more**: added
- **relative-time**: added
- **sparkline**: added

### Component commits since 2026.43.1

- GreetingCard to the current rules: translatable text, shipped again (8de216c)
- Five components: CopyField, RelativeTime, Sparkline, ConfirmButton, ReadMore (301e30b)
- Make the repo a blueprint: config, init, templates and a docs split (5e37fb4)
- Factory: component contracts, O11 generators and release records (c24b6ce)

### Tooling and docs since 2026.43.1

- o11 generator: trigger parameters never shadow a Block input (ed7e3ad)
- Project status: the namespace is chosen (AIOutsystemsFED) (740ad91)
- Namespace AIOutsystemsFED; a shared toolchain and a single-entry release (55edaf8)
- Add a How-to guide: short recipes for every common task (b2fcf51)
- Lockfile: record the template's TypeScript pin exactly (7.0.2) (4ffed90)
- Update the build tools: esbuild 0.28, jsdom 30, sass 1.105.2, TypeScript 7 (#1) (15cdc62)
- Pull request template, code owners and generated component READMEs (5e97b29)
- Keep personal Claude Code settings out of the repo (7740106)
- Fix the three CodeQL findings in the release scripts (d92add6)
- AI tooling, dev environment, CI and a security baseline (f0ee966)
- Remove the references to the article the technique came from (e32109f)
- Release notes: a new project's history starts at init (bcd1571)
- Keep project status out of the blueprint README; init writes a fresh project page (783998c)
- Record the first O11 end-to-end run of GreetingCard (83f5e82)

## 2026.43.1 (2026-10-21)

Built 2026-10-21T11:22:39.077Z. Previous release: 2026.42.1.

### Components

- **greeting-card**: CSS changed

### Component commits since 2026.42.1

- Write component styles in SCSS, compiled to the same flat CSS (66b05c7)
- Add ESLint, Prettier, stylelint and the outsystems-ui package (849b117)

### Tooling and docs since 2026.42.1

- Add release notes to CHANGELOG.md when a release is committed (64ee71f)
- Rename the project to AIOutsystemsFED (1d9871e)

## 2026.42.1 (2026-10-15)

Built 2026-10-15T11:18:37.009Z. First release.

### Components

- **greeting-card**: added

### Component commits up to this release

- Make the repo OutSystems 11 only (376140f)
- Ship component CSS as its own stylesheet, from a style/ folder (8aaf196)
- Restructure: components/, docs/, scripts/ and npm workspaces (dcc194a)
- Add CLAUDE.md, the new-pattern and publish-pattern-odc skills, and more style checks (bbd9303)
- Add Style.md with the CSS rules for patterns, and align GreetingCard (5adca8f)
- Name every GreetingCard class with BEM and make it the golden rule (ba7be5d)
- Give GreetingCard a themed look and feel (d1869cb)
- Apply ExtendedClass on the Block's main container, not in the class (f374ed1)
- Add ExtendedClass to GreetingCard and make it a rule for every pattern (21f20f9)
- Add step-by-step guide and GreetingCard reference implementation (69f5551)

### Tooling and docs up to this release

- Add a version to the combined JS and CSS headers (eb8e228)
- Add a matching dist/components.js and .css build (not uploaded) (4dbaa10)
- Add docs/NewComponent.md: step-by-step guide for a new component (bdd5086)
- Add the first dist/components.js build (not uploaded) (7838c37)
- Add npm run build:all: one timestamped file for every component (23cdbf0)
- Record what building the Sandbox screens taught us (21eaedb)
- AppGuidelines: new screens go in the MainFlow UI flow (8b1784e)
- Add AppGuidelines.md with the LayoutTopMenu rule for screens (07ecf07)
- Split the guides into a shared Components.md and two platform guides (ee3a6f4)
- Rewrite the README for both platforms (d3c21ff)
- Guide: record the Style.md alignment publish measurements (5c7f0ea)
- Guide: record the BEM look-and-feel publish measurements (27b5a27)
- Add O11 guide and rename the ODC guide to Components_ODC.md (0865e15)
- Guide: record the main-container publish and its compiled style (ff0d964)
- Guide: record the ExtendedClass publish measurements and checks (0f2b7fe)
