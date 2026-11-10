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
| Server addresses, keys or tokens in the repo | `check-private`, in every `npm test` and in CI, refuses secret-shaped values and OutSystems server addresses. Environments are recorded as labels (`dev`, `prod`), never hostnames; `release:record` refuses a hostname. Credentials reach the tools through environment variables (`O11_APP_URL`) and CI secrets, never a file or a command line. Turn on secret scanning with push protection in the repository settings | `scripts/check-private.mjs`, `scripts/release-record.mjs`, repository settings |
| Client names and real module names in the repo | They go in `factory.config.local.json`, which git ignores; `check-private` refuses the words in `.forbidden-words` (also ignored) and in the CI secret `FORBIDDEN_WORDS`, and `npm run check:private -- --history` scans every commit | `scripts/check-private.mjs`, `.gitignore` |
| Personal settings and credentials files | Everything in `.claude/` but `skills/` is ignored, and `check-private` refuses a committed `settings.local.json` or `.env` | `.gitignore`, `scripts/check-private.mjs` |
| What's live differs from what was reviewed | The bundle isn't minified, every release is recorded with sha256 hashes, and the served files are compared with them after publishing | `releases/`, `docs/guide/Components_11.md` step 8 |

## If something private was committed

1. **Revoke or change a secret first.** It's compromised from the moment it's pushed, whatever happens to the history.
2. **Remove it from the files**, and add the name to `.forbidden-words` so it can't come back.
3. **Rewriting history removes it from the branches**, but needs a force-push and a new clone everywhere; agree on it first. Keep a `git bundle` of the old history outside the repo until you're sure.
4. **GitHub keeps the old commits** reachable by their hash, and in pull request refs (`refs/pull/*`), until [GitHub Support](https://support.github.com/) purges them; send them the commit hashes.

## Repository settings to turn on

These live in GitHub, not in the repo, so set them once per repository: **Settings → Advanced Security**: Dependabot alerts, secret scanning, push protection, private vulnerability reporting. **Settings → Branches**: protect `main`, require the `CI` and `CodeQL` checks and a review before merging.
