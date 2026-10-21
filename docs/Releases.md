# Releases

Every committed release of `dist/components.js` and `dist/components.css`, newest first: what it contains, where it was deployed and how that was checked.

> Generated from `releases/<version>.json` by `scripts/release-record.mjs`. Don't edit this page; record a release or a deployment with `npm run release:record` (see the README, "Releasing").

| Version | Built | Components | Deployed to | Breaking changes |
|---|---|---|---|---|
| [2026.43.1](#2026431) | 2026-10-21 | greeting-card | personal / Sandbox | none |
| [2026.42.1](#2026421) | 2026-10-15 | greeting-card | not recorded | none |

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
