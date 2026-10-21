# Security

## Reporting a problem

Don't open a public issue for a security problem. Use GitHub's **private vulnerability reporting** (the repository's Security tab, "Report a vulnerability"), or contact the maintainers directly. Say what's affected (a component, the build, a generator), how to reproduce it, and which release (`releases/<version>.json`) if it's in something already deployed.

## What protects the code

| Risk | Protection | Where |
|---|---|---|
| OutSystems data injecting markup into a component | Data enters the DOM through `textContent` only; `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write` and `eval`-like calls fail the lint | `eslint.config.mjs` |
| A component injecting CSS or touching the Block's container | Checked by every component's tests | `test/checks.js` |
| Vulnerable dependencies | `npm run check:audit` in CI fails on any high or critical advisory that isn't accepted with a written reason; Dependabot proposes updates weekly | `scripts/check-audit.mjs`, `.github/dependabot.yml` |
| Vulnerable code patterns | CodeQL (security-extended) on every push and pull request, and weekly | `.github/workflows/codeql.yml` |
| Server addresses, keys or tokens in the repo | Environments are recorded as labels (`dev`, `prod`), never hostnames; `release:record` refuses a hostname. Turn on secret scanning with push protection in the repository settings | `scripts/release-record.mjs`, repository settings |
| What's live differs from what was reviewed | The bundle isn't minified, every release is recorded with sha256 hashes, and the served files are compared with them after publishing | `releases/`, `docs/guide/Components_11.md` step 8 |

## Repository settings to turn on

These live in GitHub, not in the repo, so set them once per repository: **Settings → Advanced Security**: Dependabot alerts, secret scanning, push protection, private vulnerability reporting. **Settings → Branches**: protect `main`, require the `CI` and `CodeQL` checks and a review before merging.
