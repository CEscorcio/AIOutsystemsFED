# AI tools in this repo

Which AI tool reads which file, what each can do here, and where the line is between work an agent can do anywhere and work that needs Service Studio.

## One set of rules, every tool

The rules live in one place, [AGENTS.md](../../AGENTS.md) at the repo root. Every other file points to it or narrows it to a kind of file; none of them repeats it.

| File | Read by | What it's for |
|---|---|---|
| [AGENTS.md](../../AGENTS.md) | Copilot (coding agent and VS Code), Claude Code (through `CLAUDE.md`), Codex, Cursor and other agents | The standing rules |
| [CLAUDE.md](../../CLAUDE.md) | Claude Code | Imports `AGENTS.md`; nothing else |
| [.github/copilot-instructions.md](../../.github/copilot-instructions.md) | Copilot Chat, Copilot code review | The essentials and the review checklist, pointing to `AGENTS.md` |
| [.github/instructions/](../../.github/instructions/) | Copilot, per file through `applyTo` | Styles, the contract, component code, tests, docs, generated files; the OutSystems one is loaded on demand |
| [.github/prompts/](../../.github/prompts/) | Copilot Chat, as slash commands | `/design-contract`, `/new-component`, `/review-style`, `/release`, `/adr` |
| [.claude/skills/new-pattern/](../../.claude/skills/new-pattern/) | Claude Code | Creating a component (the same steps as `/new-component`) |
| [.mcp.json](../../.mcp.json) | Claude Code, VS Code (Copilot agent mode) | The Service Studio MCP server, `http://127.0.0.1:41820/mcp` |
| [.github/workflows/copilot-setup-steps.yml](../../.github/workflows/copilot-setup-steps.yml) | Copilot coding agent | Its environment: Node, `npm ci`, the hook, a passing `npm test` before it starts |

When a rule changes, change `AGENTS.md` or the guide it points to, and the matching file in `.github/instructions/` if it narrows that rule. Keep the copies short so there's little to drift.

## What runs where

| Work | Local, with Service Studio (Windows) | Local, without it | Codespaces or dev container | Copilot coding agent, CI |
|---|---|---|---|---|
| Contract, code, SCSS, tests, docs | yes | yes | yes | yes |
| `npm test`, `build:all`, release records | yes | yes | yes | yes |
| Generate the Model API lambdas (`o11:generate`) | yes | yes | yes | yes |
| Apply them, merge, publish, read a module | **yes** | no | no | no |
| Verify what a server serves (`moduleinfo`, curl) | yes | yes | yes, with network access | yes, with the server as a secret |

Service Studio's MCP server only exists on a machine with Service Studio open, and it only edits the modules open there. An agent that can't reach it prepares the change, generates the lambdas and says what's left; someone with Service Studio applies them, following [Components_11.md](Components_11.md).

## Copilot features and plans

- Instructions, prompt files, agent mode and MCP work in VS Code on any Copilot plan.
- The **coding agent** (assign an issue to Copilot, get a pull request) and **Copilot code review** need a plan that includes them (Business or Enterprise at the time of writing; check GitHub's current plans). `copilot-setup-steps.yml` is ignored until then.
- Turn on, per repository: Copilot code review on pull requests, and the coding agent's access to this repository.

## Setting up a machine

1. Node.js 22 (`.nvmrc`; at least 20, per `engines`), Git, VS Code.
2. Open the repo: VS Code suggests ESLint, stylelint, Prettier and Copilot (`.vscode/extensions.json`). `.vscode/settings.json` turns on `AGENTS.md` and instruction files for Copilot Chat.
3. `npm install`. It also installs the git hook.
4. For the OutSystems side: Service Studio 11 with its MCP Server enabled. Claude Code and VS Code pick up `.mcp.json`, and ask you to approve the server the first time.

Or open it in Codespaces: `.devcontainer/` installs everything and runs `npm test`, for all the work that doesn't need Service Studio.
