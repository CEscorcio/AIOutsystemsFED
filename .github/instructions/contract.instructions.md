---
name: 'Component contract'
description: "Use when changing a component's Block contract: component.json or types.ts."
applyTo: '{components,templates}/*/component.json,{components,templates}/*/src/**/types.ts'
---

# The contract

`component.json` describes the component's OutSystems Block as data; `types.ts` says the same in TypeScript. They change together, in the same commit, and `npm test` (`check-contracts`) fails when they disagree. The field reference is the header of [scripts/lib/contract.mjs](../../scripts/lib/contract.mjs).

- Inputs are PascalCase in `component.json` and camelCase in `<Class>Parameters`, with matching types: Text → `string`, Integer and Decimal → `number`, Boolean → `boolean`. Each has `mandatory`, a `default` written as an OutSystems expression (`"\"\""`, `"0"`, `"False"`), a `description`, and an `example` the harness uses.
- Don't list `ExtendedClass`: every Block gets it, the Block applies it to its main container, and it never reaches the class.
- Events start with `On`; each is an optional callback in `<Class>Events` with the event's params in order. In OutSystems each is raised through a bridge Client Action `Trigger<Name>`.
- `namespace` is the one in `factory.config.json`. Don't choose a new one per component.
- Say in the commit message when a change is **breaking** for screens that use the Block: removing an input, event or modifier, changing a type or an event's params, adding a mandatory input, or making an input mandatory. The release record flags these too.
