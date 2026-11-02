---
name: 'design-contract'
description: "Propose a new component's Block contract (component.json and types.ts) from a description, before any code."
argument-hint: 'What the component does, e.g. "a badge that shows an order status and raises a click"'
agent: 'agent'
---

Design the contract for a new component from this description: ${input:description:What should the component do?}

Read [AGENTS.md](../../AGENTS.md), [the contract instructions](../instructions/contract.instructions.md), [Style.md Rule 0](../../docs/guide/Style.md) and [templates/greeting-card/component.json](../../templates/greeting-card/component.json) first.

Then propose, without creating any files yet:

1. **Names**: the class (PascalCase) and its BEM block (kebab-case). The block must not be an OutSystems UI class name (`card`, `tag`, `badge`, `tabs`, …; the scaffold has the list).
2. **`component.json`**: every input with type, mandatory, default (an OutSystems expression), description and example; every event with its params; the modifiers a screen may set through `ExtendedClass`. Use the namespace from `factory.config.json`. Keep it minimal: an input or event nobody needs yet is a breaking change to remove later.
3. **`types.ts`**: the matching `<Class>Parameters` and `<Class>Events` interfaces.
4. **Open questions**: anything in the description that could go two ways.

When the user agrees, create the component with the `/new-component` prompt.
