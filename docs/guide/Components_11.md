# Shipping a pattern to OutSystems 11: steps 6 to 8

The OutSystems side of [Components.md](Components.md). It starts where that page's step 5 ends: you have a pattern with its contract, class, CSS and a green `npm test`. This page puts it into an O11 Reactive module as a Block, publishes it, and proves that what's live is what you wrote. The agent works through **Service Studio's own MCP server**, editing the module you have open with the OutSystems Model API, and you review every change in Service Studio's Compare-and-Merge window before it lands.

> **Status: run end to end twice, all but the browser check (8c).**
>
> - **2026-10-21, by hand:** one component went into an O11 Reactive app: Script, theme stylesheet section, Block and a harness screen, one merge each, then one publish. Steps 8a and 8b passed.
> - **2026-10-22, from the [generated lambdas](#generated-lambdas):** six components, checked with `npm run o11:verify`.
>
> What the platform did to the uploaded files, and the Model API details it needed, are in [PlatformNotes.md](PlatformNotes.md).
>
> The Service Studio MCP workflow itself was also used earlier on O11 to build two screens; what that showed is in [Working with the Service Studio MCP](#working-with-the-service-studio-mcp).

**Reactive Web first.** The bridge described on this page relies on Block lifecycle events (`OnReady`, `OnParametersChanged`, `OnDestroy`) and JavaScript nodes with `$parameters` / `$actions`. Those exist in Reactive Web and Mobile modules. Traditional Web Blocks don't have that lifecycle; they get a different bridge, generated with `--traditional` ([Traditional Web](#traditional-web)).

## How the agent works here

| | |
|---|---|
| Agent's channel | Service Studio's MCP server on your machine; the agent edits the open module with C# Model API code |
| What it can reach | Only modules open in Service Studio, plus their references |
| Cost | None. Edits run locally |
| Reviewing a change | Service Studio's **Compare-and-Merge** window, before anything is merged |
| Script and stylesheet content | Assigned directly from the files in `dist/`. No AI model retypes them, so nothing gets "improved" on the way |
| Publishing | 1-Click Publish, through the MCP tool or by you in Service Studio |
| Confirming the live version | Service Center module version, or the `moduleinfo` manifest |
| Deploying to other environments | LifeTime, by hand. Not covered here |
| Adding a module dependency | **You do it** in Manage Dependencies. The agent can't add a new dependency |

## Where to put it

| Module | Use it when | Notes |
|---|---|---|
| A **Reactive library** (e.g. a `*_Pat` module) | The pattern will be reused | Libraries have no screens, so the harness screen lives in a consuming app. Set the Block to **Public** |
| A **Reactive Web app** | First experiment | Script, Block and harness in one module, one publish |

Start in a throwaway Reactive app. Move to the library once the steps work.

## Prerequisites

| What | Why | Notes |
|---|---|---|
| An O11 environment you can publish to | The target | A personal or development environment. Never production |
| Service Studio 11 with the **MCP Server** enabled | The agent's channel | Approve the agent's session when Service Studio asks. To let the agent merge and publish without a dialog, allow **automatic merge and publish** in the MCP Server dialog; otherwise you'll do those two steps yourself |
| The module open in Service Studio | The agent only sees open modules | Open the consuming app too, if the harness lives there |
| Claude Code | Drives the Model API edits | Connected to Service Studio's MCP server (`/mcp`) |
| Node and network access to the server | `npm run o11:verify` downloads the published files | The app's URL is passed on the command line, never committed |
| Steps 1 to 5 of [Components.md](Components.md) done | The bundle to ship | `npm test` green, `dist/` committed |

## Before step 6: four O11 checks on steps 1 to 5

- **Check the fallback values against your OutSystems UI version.** [Style.md](Style.md) lists the values from OutSystems UI 2.30.0, which our O11 Sandbox app loads (read from its stylesheet's header; the individual token values weren't compared one by one). The tests take the values from the `outsystems-ui` package pinned in the root `package.json` (2.30.0). If your environment runs another version, pin the package to that version (`npm install -D --save-exact outsystems-ui@<version>`) and run `npm test`.
- **Check that the OutSystems UI classes you reuse exist in your version.** The card uses `card` and `btn btn-primary`; both are in OutSystems UI 2.x.
- **Put the component's CSS in the theme stylesheet, never the Block's.** It ships as its own file (`dist/<Name>.css`, or `dist/components.css` from `npm run build:all`). Edits to a non-empty Block stylesheet don't publish reliably through the Service Studio MCP (the merge succeeds, but the old CSS is still served), while theme stylesheet edits did publish every time they were tried.
- **In Service Studio, never style a pattern from a screen** through its OutSystems UI classes (`.card`, `.btn`) or by element (`.greeting-card p`). Pick a modifier through `ExtendedClass` instead.

## Step 6: the platform side, reviewed in Service Studio

With O11 you aren't spending a quota, but **one element per request** is still the right size: each one ends in a Compare-and-Merge window you can actually read. Ask for these three in order, in the same Claude Code session. Every request ends the same way:

1. the agent edits a copy of the module with Model API code
2. it reads the result back and checks for TrueChange errors
3. it calls merge, and Service Studio shows the diff
4. you accept the diff in Service Studio

If your Service Studio is set to accept merges automatically, step 4 happens without a dialog. Look at the module afterwards anyway.

### Generated lambdas

The requests below describe each element in words. Since the first run, the repo generates them instead: `npm run o11:generate` reads `component.json` and `dist/`, and writes each lambda plus a probe to `platform/o11/out/`. In order:

| Step | Command | Then |
|---|---|---|
| Script | `npm run o11:generate -- script` | Run `script.probe.cs` (a dry run) and compare with the printed values; apply `script.cs`; merge |
| Stylesheet | `npm run o11:generate -- theme --theme <Theme>` | Apply `theme.cs` (it appends the section, or replaces it between the markers); run `theme.probe.cs` on the saved copy; merge |
| Block | `npm run o11:generate -- block <component>` | Dry run with `block-<component>.probe.cs`; apply `block-<component>.cs`; read the Block back; merge |
| Harness | `npm run o11:generate -- harness <component>` | Dry run, apply, merge |
| Showcase | `npm run o11:generate -- showcase <component>` | For a component whose `component.json` has a `showcase`: an example screen, one instance per example, with any placeholders filled with the example Links. Dry run, apply, merge |

The agent passes each file's content to `applyModelApiCode` as it is. The probes report lengths, checksums or names, and the generator printed what they must be, so a copy that's off by one character is caught before the merge.

> **Run against Service Studio on 2026-10-22** (release 2026.43.2): the Script, the theme section (its replace path), six Blocks and six harness screens, each dry-run, applied and merged on its own, then published and compared with `dist/`. [PlatformNotes.md](PlatformNotes.md) has what that run measured.

**Read the dry run's validation messages, not only the probe line.** The probe reports names and checksums. A mistake that leaves those right shows up only as a new message, such as the "Unused Element" warning that exposed a renamed parameter in that run. Compare the messages with the ones the module had before; anything new is about your change.

What they don't do: change an existing Block (the generator stops if the Block exists; edit a contract change by hand), add a module dependency, or publish.

### Request A: the Script

The agent reads `dist/GreetingCard.js` and assigns it to the Script's `JavaScript` property. The content goes in as a C# string literal, not through a model's rewrite. The main risk is in escaping, so the request asks for a check:

```text
In module <Module>, add a Script named "GreetingCard" whose JavaScript is the exact
contents of components/<component>/dist/<Class>.js. Set the property directly from the
file; don't reformat anything. After applying, read the Script back and confirm its
length and line count match the file. Create nothing else. Merge, don't publish.
```

If the module is a library and consumers should load the Script through the Block only, leave it **not** Public. The Block's Required Scripts takes care of loading it.

### Request B: the Block

Copy the names from `types.ts`. The bridge Client Action and the guards are there for the reasons in [Components.md, "What the Block does with it"](Components.md#what-the-block-does-with-it): in a Reactive JavaScript node, too, `$actions` lists Client Actions, not Block Events.

```text
In module <Module>, create a Block "GreetingCard" (Public = <Yes for a library, No
for an app>). It is a thin bridge to window.<Namespace>.GreetingCard defined in the
"GreetingCard" Script. Only create this Block. Merge, don't publish.

1. Input Parameters: Name (Text, mandatory, default ""), ButtonLabel (Text, not
   mandatory, default "Greet"), ExtendedClass (Text, NOT mandatory, default "").
2. Event: OnGreetClicked with one input parameter Count (Integer).
3. Local Variable: Instance (Object).
4. Widget tree: a single empty Container named "MountPoint" (the pattern's main
   container). Set its Style Classes to exactly:
   "greeting-card" + If(ExtendedClass <> NullTextIdentifier(), " " + ExtendedClass, "")
5. Required Scripts: add the "GreetingCard" Script.
6. Client Action "TriggerGreetClicked" (input Count, Integer) whose only step is
   Trigger Event OnGreetClicked with Count = Count.
7. Handlers for OnReady, OnParametersChanged and OnDestroy, each with one
   JavaScript node, exactly as below.

OnReady — inputs RuntimeId = MountPoint.Id, Name, ButtonLabel; output Instance,
assigned to the local variable Instance:
$parameters.Instance = new <Namespace>.GreetingCard({
  runtimeId: $parameters.RuntimeId,
  name: $parameters.Name,
  buttonLabel: $parameters.ButtonLabel,
  events: { OnGreetClicked: $actions.TriggerGreetClicked }
});

OnParametersChanged — inputs Instance, Name, ButtonLabel:
if ($parameters.Instance) {
  $parameters.Instance.onParametersChanged({
    name: $parameters.Name,
    buttonLabel: $parameters.ButtonLabel
  });
}

OnDestroy — input Instance:
if ($parameters.Instance) {
  $parameters.Instance.destroy();
}

ExtendedClass is used only by MountPoint's Style Classes. Do not pass it to any
JavaScript node. Lay out each handler's flow cleanly (Start, JS node, Assign
where needed, End) before merging.
```

In the Compare-and-Merge window, check the four things step 8b checks after publishing: the guards are there, the names match `types.ts`, `ExtendedClass` reaches no JS node, and the event goes through `TriggerGreetClicked`.

### The stylesheet

The component's CSS goes in the module's **theme stylesheet**, as one marked section after Theme Editor's own block ([Style.md, Rule 7](Style.md#rule-7-where-a-patterns-css-lives)). The agent sets it directly from the file, like the Script:

```text
In module <Module>, add the contents of dist/components.css (or dist/<Name>.css) to the
theme stylesheet as one section at the end, after Theme Editor's own block. Start it
with the guard rule ".components-start { }", then the line
/* ==== components: start (built <timestamp from the file's header>) ==== */
then the file, then /* ==== components: end ==== */. If such a section already
exists, replace it whole. Change nothing else in the theme. Merge, don't publish.
```

Two things the Service Studio MCP has shown about theme stylesheet edits:

- **The first 2 characters after Theme Editor's block are dropped**, which can turn a leading `/*` into a stray `*/` that kills the next rule. The guard rule `.components-start { }` absorbs that, so start the section with it.
- **The agent may report an `InvalidIconLibrary` error** after editing the theme stylesheet. It comes from the agent's own validator; Service Studio's validation of the merged module was clean and the edits published. Any other error still blocks the merge.

**Done once with `dist/components.css`** (2026-10-21): the section published intact; see [PlatformNotes.md](PlatformNotes.md#what-the-platform-serves) for the line endings and the guard rule.

### Request C: a screen that uses it

A Block that no screen uses isn't in the published JavaScript, so build a harness. In an app, put it on any screen. For a library, open a consuming Reactive app, **add the dependency on the Block yourself** in Manage Dependencies (the agent can't add new dependencies), then ask:

```text
In module <ConsumerApp>, on the <Screen> screen, below the existing content, add a
test harness for the GreetingCard Block. Change nothing else. Merge, don't publish.

1. Screen Local Variable VisitorName (Text, default "OutSystems").
2. A Label "Your name" and an Input bound to VisitorName.
3. A GreetingCard Block with Name = VisitorName and ButtonLabel = "Say hello".
4. Handle OnGreetClicked with a screen Client Action "GreetingCardOnGreetClicked"
   (input Count, Integer) whose only step is a Message:
   "OnGreetClicked fired: Count = " + Count.
```

If colleagues should open the harness without logging in, ask for the **Anonymous role** to be added to the screen's roles. Setting the screen's anonymous-access flag directly gets dropped by the merge.

## Step 7: publish

Publish the module that changed, and with a library, then the consumer:

1. **The library** (if you used one). Then, in the consumer, **refresh the dependency** (the agent can do this) so it picks up the new Block.
2. **The consumer app**, or the single app.

Ask for it explicitly ("publish <Module>"). The agent only publishes when asked. It uses 1-Click Publish and waits; a small module took about 16 seconds when the MCP was tested. If automatic merge and publish isn't allowed in the MCP Server dialog, the call is blocked and nothing is published; publish from Service Studio instead.

A "published" result isn't proof on its own. Confirm in **Service Center → Factory → Modules → <Module>** that the current version is the one you just published, and run step 8.

## Step 8: verify what was actually published

Steps 8a and 8b are one command. It only reads: it downloads the app's `moduleinfo` manifest and the files it lists, and compares them with `dist/`. A library's Script is served through the consuming app, so pass the app:

```bash
npm run o11:verify -- --app https://<server>/<App>              # every component
npm run o11:verify -- --app https://<server>/<App> read-more    # one component
npm run o11:verify -- --app https://<server>/<App> --keep tmp/served   # keep the files to look at
```

`O11_APP_URL` works instead of `--app`. Don't commit the URL. It exits non-zero when any check fails. Run on 2026-10-22: 25 checks passed against six components.

### 8a. The Script and the theme are your build

The Script must be identical to `dist/components.js` after removing a byte-order mark: line endings stay LF and the final newline is kept. The theme must hold one components section, identical to `dist/components.css` once line endings are normalised ([PlatformNotes.md](PlatformNotes.md#what-the-platform-serves)). Anything more is a finding; record it there. Because the content was set from the file rather than retyped by a model, any difference comes from the platform or from escaping, not from AI rewriting.

### 8b. The JS nodes are wired as you asked

Each Block compiles to `scripts/<App>.<Flow>.<Block>.mvc.js`. The check looks for `new <Namespace>.<Class>(`, the `onParametersChanged` and `destroy` calls, and each `Trigger<Event>` action. It also checks that each `<Class>Test` screen uses its Block. With `--keep`, also look by eye: the guards survived (possibly rewritten as `x && …`), the parameter names match `types.ts`, and no `extendedClass` reaches the JS nodes.

### 8c. It works in a real browser

Open the harness screen and click through:

1. The card renders inside the Block with the starting name.
2. Each click shows the Message with the count going up (proves the event made it back through the bridge).
3. Typing in the input updates the greeting live (proves `onParametersChanged`).
4. DevTools → Elements: the main container carries `greeting-card` plus any `ExtendedClass`, and every class inside it is `greeting-card__*`, `greeting-card--*` or OutSystems UI.
5. DevTools → Console is clean.

## Traditional Web

The same release and the same component classes also run in a Traditional Web module, with a different bridge. `factory.config.json`'s `traditional` section names the theme, the flows, the script Web Block and the layout. Each generator command takes `--traditional`:

| Step | Command | What it builds |
|---|---|---|
| Script | `npm run o11:generate -- script --traditional` | A Web Block (`traditional.scriptBlock`, e.g. `ComponentsScript`) whose JavaScript is `dist/components.js`. Traditional Web Blocks have no Required Scripts, so each component Block contains an instance of this Block, which loads the bundle |
| Stylesheet | `npm run o11:generate -- theme --traditional` | The components section of the module's Web theme, appended or replaced between the same markers |
| Block | `npm run o11:generate -- block <component> --traditional [--name <Block>]` | A Web Block: the mount container (its classes through an extended property `class`, since a Traditional container's Style Classes is static text), each placeholder in its container, a hidden Link per event in `<block>__bridge` whose Ajax On Click raises the Block event, the script Block's instance, and an Expression widget (Escape Content off) that writes the `<script>` starting the class with the widgets' ids on every render. Events with parameters aren't supported yet |
| Showcase | `npm run o11:generate -- showcase <component> --traditional [--block <Block>]` | The example screen on the configured layout (`traditional.layout`, with `layoutFill` blocks such as the menu); events and menu items show a message through RichWidgets' `Feedback_Message`. The lambda builds the examples with C# loops over data, which keeps it short enough to pass on unchanged |

Same rules as the Reactive side: dry-run each lambda (its probe), apply, merge, one element at a time; for the theme, apply first and run the read-back probe before merging. There is no `harness` for Traditional yet, and `o11:verify` reads the Reactive `moduleinfo` manifest, which Traditional apps don't have.

**Run on 2026-10-28** in a Traditional style-guide module (DropdownButton as `DropdownButtonPattern`): the script Block, the theme section, the Block and the showcase screen each matched their probe and merged, and the module's validation was empty. **Not yet verified:** publishing, the served files, and the browser click-through.

## Working with the Service Studio MCP

What building the Sandbox app's `Wireframe` and `Design` screens through the Service Studio MCP showed. It applies to step 6 onwards here, and to any other edit made through it.

**Connecting:**

- **After Service Studio restarts, reconnect from Claude Code.** Claude Code doesn't retry a connection it lost: the server is back up, but the agent's tools stay unavailable until you run `/mcp` and reconnect `servicestudio`.
- **After a restart, the agent needs a new session token.** The server's instructions say to keep reusing the first token, but tokens don't survive a Service Studio restart: the old one is rejected with "requires a valid session token". The agent requests a new one, and Service Studio may ask you to approve it.
- **Don't identify a module by the key the agent lists.** The same Sandbox module was listed with a different key after a restart, though its contents were unchanged. Identify it by name and by what it contains.

**Editing:**

- **Read the module before changing it.** You or a colleague may have changed it in Service Studio since the agent last looked: a header container the agent had built was gone the next time it read the screen.
- **Dry-run each edit before applying it.** The agent runs the edit once with a deliberate exception at the end, which returns Service Studio's validation messages without saving anything, then runs it again for real. On the `Design` screen this caught a Date/DateTime comparison error before anything was saved.

**Publishing:**

- **Publishing is blocked until you allow it.** The agent's 1-Click Publish returns `blocked`, and publishes nothing, until **automatic merge and publish** is allowed in Service Studio's MCP Server dialog. Until then, publish from Service Studio yourself.
- **A small module published in about 15 to 20 seconds** (upload, compile, deploy).
- **Check what deployed in the compiled screen file.** `https://<server>/<App>/moduleservices/moduleinfo` lists `scripts/<App>.<Flow>.<Screen>.mvc.js`. Download it and search it for what you changed (the layout block, a section's text, an aggregate's name) to confirm the change is live.

## Limits to know before you start

These are documented limits of the Service Studio MCP, not ones we hit on this pattern yet.

| Limit | What to do |
|---|---|
| The agent can only edit modules **open** in Service Studio | Open the library and the consumer before asking |
| The agent **can't add a new dependency** | Add it in Manage Dependencies yourself, then ask the agent to continue |
| Refreshing references drops any unmerged edits from the agent's view | Merge first, then refresh |
| **Block stylesheet** edits may not reach the published CSS | Put component CSS in the theme stylesheet ([The stylesheet](#the-stylesheet)) |
| Publishing is blocked unless you allow automatic merge and publish | Allow it in the MCP Server dialog, or publish from Service Studio |
| A screen's anonymous-access flag is dropped by the merge | Add the Anonymous role to the screen's roles |
| The write tools are a **Beta Feature** | See the [Beta Features agreement](https://www.outsystems.com/legal/beta-features-agreement) |
| No deployment between environments | Use LifeTime |

## O11 checklist

1. Steps 1 to 5 of [Components.md](Components.md) done; `npm test` green; `dist/` committed; the four O11 checks above.
2. Open the module (and the consumer) in Service Studio.
3. Request A (Script from file), request B (Block with bridge action and the main container's Style Classes), request C (harness). Review each Compare-and-Merge.
4. Publish the library, refresh the dependency, publish the consumer; confirm the version in Service Center.
5. Diff the Script, find the JS nodes, click through in the browser.
6. Record anything new you measured in [PlatformNotes.md](PlatformNotes.md), and the release with `npm run release:record`.
7. Only then use the Block on real screens.

## References

- [Components.md](Components.md): the idea, the rules and steps 1 to 5
- [Style.md](Style.md): the CSS rules for every pattern
