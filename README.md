# AI-assisted OutSystems front-end

How to build a custom front-end pattern in TypeScript, keep it in Git with a build and tests, and ship it into an ODC app as a Block, with an AI agent doing the platform work through the official OutSystems MCP server.

## What's here

**[Building a custom TypeScript pattern for ODC, step by step](Components_ODC.md)** · EN · PT pending

The recipe, run end to end: write the contract, write the class to the bridge's three-member rules, build for diffability, test in jsdom, then three agent turns (Script, Block, harness screen) and a publish. Ends with how to verify the published Script byte for byte, how to find the compiled JS nodes, and the platform limits we hit along the way.

**[Building a custom TypeScript pattern for OutSystems 11, step by step](Components_11.md)** · EN · not yet run end to end

The same pattern on O11 Reactive, with the agent working through Service Studio's MCP server instead of Mentor: the repo steps are shared, and the platform side becomes three Model API edits you review in Compare-and-Merge, a 1-Click Publish, and the same verification.

**[Style rules for custom patterns](Style.md)**

The CSS rules every pattern follows on both platforms, with OutSystems UI as the base theme: BEM class names (the golden rule), OutSystems UI classes next to them, every visual value an OutSystems UI variable with its base-theme fallback, one-class selectors, device classes, right-to-left and accessibility. Lists the base theme's variables and which rules `npm test` enforces.

**[`greeting-card/`](greeting-card/)**

The reference implementation the guide walks through: TypeScript source, esbuild bundle, 29 checks that run in jsdom (`npm test`) and in the browser (`preview/index.html?test=1`). Copy it as the starting point for your own pattern.

## Vocabulary

In case this is someone's first contact with the platform.

| Term | What it is |
|---|---|
| **ODC** | OutSystems Developer Cloud, the current cloud platform. The official remote MCP server covers this one only |
| **O11** | OutSystems 11, the classic platform — Traditional Web and Reactive. Reached through Service Studio's own MCP server, on the modules open in Service Studio |
| **Tenant** | The OutSystems environment, company or personal, where the apps live |
| **Personal Edition** | A free OutSystems environment for personal study, with no production risk and a tight agent quota |
| **MCP** | Model Context Protocol, the channel that lets an AI agent talk to the tenant in real time |
| **Mentor** | The ODC-side AI agent that actually edits the app. Its quota is counted per tenant |
| **Block** | An OutSystems UI component. In this technique it becomes a thin shell pointing at external code |
| **Client Action** | A client-side OutSystems action — the only thing `$actions` resolves inside a JS node |
| **Placeholder** | A slot where native OutSystems content can be inserted inside a Block driven by high-code |
| **Publish** | Compile and activate the edited version of the app in the chosen environment |

## Scope and disclaimers

Everything described here was done in a **personal ODC Personal Edition tenant**, on throwaway apps, with no customer code or customer data involved. Tenant names, app keys and URLs have been left out on purpose: they add nothing and they age badly.

Where something was **not** verified by us, the guide says so. The ODC guide was run end to end; the O11 guide has not been yet.

The Block-as-bridge technique comes from a published article by [António Carvalho](https://antonio-carvalho.medium.com/ai-powered-frontend-development-in-outsystems-o11-and-odc-4d408fdb4ade), credited in the guide. The component reuses OutSystems UI class names (BSD-3-Clause) and copies none of its code.
