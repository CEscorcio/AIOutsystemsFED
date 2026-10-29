# Releases

Every committed release of `dist/components.js` and `dist/components.css`, newest first: what it contains, where it was deployed and how that was checked.

> Generated from `releases/<version>.json` by `scripts/release-record.mjs`. Don't edit this page; record a release or a deployment with `npm run release:record` (see the README, "Releasing").

| Version | Built | Components | Deployed to | Breaking changes |
|---|---|---|---|---|
| [2026.44.1](#2026441) | 2026-10-28 | confirm-button, copy-field, dropdown-button, greeting-card, read-more, relative-time, sparkline | styleguide / SGLiveStyleGuideTraditional_SandBox | none |
| [2026.43.2](#2026432) | 2026-10-22 | confirm-button, copy-field, greeting-card, read-more, relative-time, sparkline | personal / Sandbox | none |
| [2026.43.1](#2026431) | 2026-10-21 | greeting-card | personal / Sandbox | none |
| [2026.42.1](#2026421) | 2026-10-15 | greeting-card | not recorded | none |

## 2026.44.1

DropdownButton added: a split button with a Menu placeholder. First release in a Traditional Web module, through the new --traditional generators; the six other components are unchanged.

- **Built:** 2026-10-28T16:14:28.459Z
- **Source commit:** `4df209994a1d`
- **dist/components.js:** 29867 bytes, sha256 `c8ee180ee597`
- **dist/components.css:** 15175 bytes, sha256 `9606a00dff7f`

| Component | Class | Inputs | Events | Modifiers |
|---|---|---|---|---|
| confirm-button | `AIOutsystemsFED.ConfirmButton` | Label: Text*, ConfirmLabel: Text, TimeoutSeconds: Integer, IsDisabled: Boolean | OnConfirmed() | confirm-button--full-width |
| copy-field | `AIOutsystemsFED.CopyField` | Value: Text*, Label: Text, CopyLabel: Text, CopiedLabel: Text | OnCopied(Value: Text) | copy-field--compact |
| dropdown-button | `AIOutsystemsFED.DropdownButton` | Label: Text*, Variant: Text, Size: Text, Enabled: Boolean, Url: Text, Icon: Text, MenuLabel: Text | OnClick() | dropdown-button--menu-end |
| greeting-card | `AIOutsystemsFED.GreetingCard` | Name: Text*, ButtonLabel: Text, Greeting: Text, FallbackName: Text, CountLabel: Text, CountLabelOne: Text | OnGreetClicked(Count: Integer) | greeting-card--compact |
| read-more | `AIOutsystemsFED.ReadMore` | Text: Text*, Lines: Integer, MoreLabel: Text, LessLabel: Text | OnToggled(IsExpanded: Boolean) | read-more--muted |
| relative-time | `AIOutsystemsFED.RelativeTime` | Timestamp: Text*, Locale: Text, EmptyLabel: Text, Live: Boolean | none | relative-time--muted |
| sparkline | `AIOutsystemsFED.Sparkline` | Values: Text*, Label: Text, ShowLast: Boolean | none | sparkline--positive, sparkline--negative |

\* mandatory. Every Block also takes `ExtendedClass` (Text, optional).

**Contract changes since the previous release:**

- dropdown-button: component added

**Deployments:**

| Platform | Environment | Module | Script | Theme | Published | Verified |
|---|---|---|---|---|---|---|
| O11 | styleguide | SGLiveStyleGuideTraditional_SandBox | ComponentsScript | SGLiveStyleGuideTraditional_SandBox | 2026-10-28 | In Service Studio: the ComponentsScript Web Block's JavaScript read back identical to dist/components.js (length and checksum), the theme's components section read back identical to dist/components.css, the DropdownButtonPattern Block and DropdownBTN screen matched their probes, module validation empty, 1-Click Publish done. Not verified: the files the server serves (the app's URL isn't known here) and the browser click-through. |

## 2026.43.2

Six components in one bundle: GreetingCard brought to the current rules (translatable text), plus CopyField, RelativeTime, Sparkline, ConfirmButton and ReadMore. First release whose Blocks and test screens all came from the generators.

- **Built:** 2026-10-22T15:11:18.397Z
- **Source commit:** `8de216c024ff`
- **dist/components.js:** 20249 bytes, sha256 `706d63ea31e4`
- **dist/components.css:** 9813 bytes, sha256 `38d2c63c394f`

| Component | Class | Inputs | Events | Modifiers |
|---|---|---|---|---|
| confirm-button | `AIOutsystemsFED.ConfirmButton` | Label: Text*, ConfirmLabel: Text, TimeoutSeconds: Integer, IsDisabled: Boolean | OnConfirmed() | confirm-button--full-width |
| copy-field | `AIOutsystemsFED.CopyField` | Value: Text*, Label: Text, CopyLabel: Text, CopiedLabel: Text | OnCopied(Value: Text) | copy-field--compact |
| greeting-card | `AIOutsystemsFED.GreetingCard` | Name: Text*, ButtonLabel: Text, Greeting: Text, FallbackName: Text, CountLabel: Text, CountLabelOne: Text | OnGreetClicked(Count: Integer) | greeting-card--compact |
| read-more | `AIOutsystemsFED.ReadMore` | Text: Text*, Lines: Integer, MoreLabel: Text, LessLabel: Text | OnToggled(IsExpanded: Boolean) | read-more--muted |
| relative-time | `AIOutsystemsFED.RelativeTime` | Timestamp: Text*, Locale: Text, EmptyLabel: Text, Live: Boolean | none | relative-time--muted |
| sparkline | `AIOutsystemsFED.Sparkline` | Values: Text*, Label: Text, ShowLast: Boolean | none | sparkline--positive, sparkline--negative |

\* mandatory. Every Block also takes `ExtendedClass` (Text, optional).

**Contract changes since the previous release:**

- confirm-button: component added
- copy-field: component added
- greeting-card: input Greeting added
- greeting-card: input FallbackName added
- greeting-card: input CountLabel added
- greeting-card: input CountLabelOne added
- read-more: component added
- relative-time: component added
- sparkline: component added

**Deployments:**

| Platform | Environment | Module | Script | Theme | Published | Verified |
|---|---|---|---|---|---|---|
| O11 | personal | Sandbox | Components | Sandbox | 2026-10-22 | Served Script identical to dist/components.js after the platform's BOM; theme section identical to dist/components.css after line-ending normalisation, one section, Version 2026.43.2; the six compiled Blocks create their AIOutsystemsFED class, update, destroy and wire their Trigger actions; the six test screens use their Block. Browser check not run. |

## 2026.43.1

GreetingCard after the SCSS conversion; the first release run end to end in OutSystems 11 (Sandbox app).

- **Built:** 2026-10-21T11:22:39.077Z
- **Source commit:** `64ee71f6af82`
- **dist/components.js:** 2627 bytes, sha256 `00b5ea7fb279`
- **dist/components.css:** 3595 bytes, sha256 `ac6e1155d361`

| Component | Class | Inputs | Events | Modifiers |
|---|---|---|---|---|
| greeting-card | `ClaudeTest.GreetingCard` | Name: Text*, ButtonLabel: Text | OnGreetClicked(Count: Integer) | greeting-card--compact |

\* mandatory. Every Block also takes `ExtendedClass` (Text, optional).

**Contract changes since the previous release:**

- none

**Deployments:**

| Platform | Environment | Module | Script | Theme | Published | Verified |
|---|---|---|---|---|---|---|
| O11 | personal | Sandbox | Components | Sandbox | 2026-10-21 | Script identical to dist/components.js (platform adds a BOM); theme section identical to dist/components.css (served with CRLF); compiled Block checked (docs/Components_11.md, First run). Browser check not done. |

## 2026.42.1

First release: the GreetingCard example, built to prove the pipeline. Where it was uploaded wasn't recorded at the time.

- **Built:** 2026-10-15T11:18:37.009Z
- **Source commit:** `eb8e2288c914`
- **dist/components.js:** 2632 bytes, sha256 `08f6c6ef412f`
- **dist/components.css:** 3618 bytes, sha256 `3d39fa2c485d`

| Component | Class | Inputs | Events | Modifiers |
|---|---|---|---|---|
| greeting-card | `ClaudeTest.GreetingCard` | Name: Text*, ButtonLabel: Text | OnGreetClicked(Count: Integer) | greeting-card--compact |

\* mandatory. Every Block also takes `ExtendedClass` (Text, optional).

**Contract changes since the previous release:**

- greeting-card: component added

**Deployments:**

- not recorded
