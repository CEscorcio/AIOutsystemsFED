# Documentation

Two kinds of documents live here:

- **`guide/`**: how the factory works and the rules every project follows. The same in every project made from this blueprint; improve it here, not per project.
- **`project/`**: this project's own records: its releases and the log of what it ran. `npm run init` empties it for a new project.

## Start here

| You are | Read, in order |
|---|---|
| **Building a component** (front-end developer) | [guide/NewComponent.md](guide/NewComponent.md) step by step; [guide/Style.md](guide/Style.md) before writing CSS; [guide/Components.md](guide/Components.md) for the reasons behind the rules |
| **Putting it in OutSystems 11** (OutSystems developer) | [guide/Components_11.md](guide/Components_11.md), then [guide/PlatformNotes.md](guide/PlatformNotes.md) for what to expect from the platform; [guide/AppGuidelines.md](guide/AppGuidelines.md) for the screens around it |
| **Reviewing a change** | [guide/Style.md](guide/Style.md) "What `npm test` checks" and its checklist; the component's `component.json` |
| **Releasing** | The README's [Versioned Builds](../README.md#versioned-builds); [project/Releases.md](project/Releases.md) for what was released where |
| **An AI agent** | [AGENTS.md](AGENTS.md) first, always |

## Guide

| Document | What it covers |
|---|---|
| [NewComponent.md](guide/NewComponent.md) | Step-by-step checklist for building a new component |
| [Components.md](guide/Components.md) | The idea, the rules every component follows, and steps 1 to 5 (everything in the repo) |
| [Components_11.md](guide/Components_11.md) | Steps 6 to 8 in OutSystems 11: Script, stylesheet, Block, harness screen, publish, verify |
| [PlatformNotes.md](guide/PlatformNotes.md) | What OutSystems 11 does to uploaded files, and the Model API details that matter |
| [Style.md](guide/Style.md) | The CSS rules: BEM class names (the golden rule), OutSystems UI variables, selectors, SCSS |
| [AppGuidelines.md](guide/AppGuidelines.md) | Rules for app screens: layout, UI flow, OutSystems UI classes, naming |

## Project

| Document | What it covers |
|---|---|
| [project/Releases.md](project/Releases.md) | Every release: contents, contract changes, deployments (generated from `releases/`) |
| [project/](project/) | Run logs and decisions specific to this project |
