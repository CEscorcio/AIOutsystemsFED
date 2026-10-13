# Shipping a pattern to ODC: steps 6 to 8

The ODC half of [Components.md](Components.md). It starts where that page's step 5 ends: you have a pattern with its contract, class, CSS and a green `npm test`. This page puts it into an ODC app as a Block, publishes it, and proves that what's live is what you wrote. The agent does the platform work through the official OutSystems MCP server, with Mentor editing the app.

**Everything here was run end to end on ODC**, on a throwaway app, with the [`greeting-card/`](greeting-card/) example. The measurements in step 8 come from those publishes.

**If your tenant is shared:** Mentor's quota is counted per tenant, so the turns you spend are your colleagues' turns too. Step 6 is designed to keep the number of turns low, and every bug [step 5](Components.md#step-5-prove-it-locally-before-going-to-the-platform) catches locally is a turn you don't spend.

**Republishing after a change** to the TypeScript or CSS only replaces the Script: one Mentor turn, one publish turn, then the checks in step 8. With Claude Code, ask to republish the pattern (the `publish-pattern-odc` skill does all of it).

## Prerequisites

| What | Why | Notes |
|---|---|---|
| An ODC tenant you can publish to | The target | Personal Edition works. Use a throwaway web app you created, not a sample |
| Claude Code with the `outsystems` plugin | Drives Mentor, publish and verification | Install from `OutSystems/outsystems-mcp`, set your tenant hostname, then authenticate once from `/mcp` |
| `curl` and `diff` | Verifying the published files | Git Bash has both |
| Steps 1 to 5 of [Components.md](Components.md) done | The bundle to ship | `npm test` green, `dist/` committed |

## Step 6: the platform side in three Mentor turns

**One element per turn.** In an earlier attempt, sending a Script and a Block in the same turn exhausted the quota (`OS-AISA-42903`) and published nothing; split into separate turns, both passed. Open one Mentor session on the app and keep it for all three turns and the publish. Each turn below took about 1 to 2 minutes and came back with 0 errors and 0 warnings.

### Turn A: the Script

Paste the bundle inline between markers and forbid any rewriting. Only do this for small bundles. A ~106 KB stylesheet sent through Mentor once killed the turn (`OS-AIWA-50001`), while pasting the same file into ODC Studio by hand was instant and used no quota. Rule of thumb: build structure through the agent, paste large content yourself.

```text
Add a new Script resource named "GreetingCard" (file GreetingCard.js) to this app.
Its content must be EXACTLY the JavaScript below, copied literally, character for
character — do not reformat, translate, rename, or "improve" anything. Only add the
Script; do not create Blocks, screens or actions, and do not change anything else.
Do not publish.

----- BEGIN GreetingCard.js -----
<contents of dist/GreetingCard.js>
----- END GreetingCard.js -----
```

To replace the Script later, the same prompt starts with *Replace the entire content of the existing Script resource named "GreetingCard"* and adds *do not keep any of the old content*.

### Turn B: the Block

Spell out every element and give the JS verbatim. Copy the names from `types.ts`. The bridge Client Action and the guards are there for the reasons in [Components.md, "What the Block does with it"](Components.md#what-the-block-does-with-it).

```text
Create a new Block named "GreetingCard". It is a thin bridge to the external class
window.ClaudeTest.GreetingCard defined in the existing "GreetingCard" Script. Only
create this Block. Do not publish.

1. Input Parameters: Name (Text, mandatory, default ""), ButtonLabel (Text, not
   mandatory, default "Greet"), ExtendedClass (Text, NOT mandatory, default "").
2. Event: OnGreetClicked with one input parameter Count (Integer).
3. Local Variable: Instance (Object).
4. Widget tree: a single empty Container named "MountPoint" (the pattern's main
   container). Set its Style Classes to exactly:
   "greeting-card" + If(ExtendedClass <> NullTextIdentifier(), " " + ExtendedClass, "")
5. Required Scripts: add the "GreetingCard" Script.
6. Client Action "TriggerGreetClicked" (input Count, Integer) whose only step is
   Trigger Event OnGreetClicked with Count = Count. (Needed because $actions in a
   JavaScript node cannot reference a Block Event directly.)
7. Three lifecycle handlers, each with one JavaScript node:

OnReady — inputs RuntimeId = MountPoint.Id, Name, ButtonLabel; output Instance,
assigned to the local variable Instance:
$parameters.Instance = new ClaudeTest.GreetingCard({
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

ExtendedClass is used only by MountPoint's Style Classes. Do not pass it to any
JavaScript node.

OnDestroy — input Instance:
if ($parameters.Instance) {
  $parameters.Instance.destroy();
}

Keep the JavaScript exactly as written, including the guards.
```

### Turn C: a screen that uses it

A Block that no screen uses isn't included in the published JavaScript, so you can't audit it. Build a harness that exercises every direction of the contract: an input bound to a parameter (tests `onParametersChanged`) and a visible reaction to the event (tests the bridge).

```text
On the Home screen, below the existing content, add a test harness for the
GreetingCard Block. Change nothing else. Do not publish.

1. Screen Local Variable VisitorName (Text, default "OutSystems").
2. A Label "Your name" and a Text Input bound to VisitorName.
3. A GreetingCard Block with Name = VisitorName and ButtonLabel = "Say hello".
4. Handle OnGreetClicked with a screen Client Action "GreetingCardOnGreetClicked"
   (input Count, Integer) whose only step is an Info Message:
   "OnGreetClicked fired: Count = " + Count.
```

## Step 7: publish

Publishing is a Mentor turn in the same session: `Publish. Publish note: "<what changed>"`. It took between 30 seconds and a minute and a half. A successful run reports the new revision and a publication key; then confirm the environment is actually running it:

> the agent calls `env_app` and checks that the live `revision` equals the revision the publish reported

A "published successfully" message on its own is not that confirmation. If a publish times out, don't publish again: the first one may still land. Check it with `publish_status` or `env_app` first.

## Step 8: verify what was actually published

### 8a. The Script is your bundle

Every app lists its versioned files at `https://<your-app-url>/moduleservices/moduleinfo`. User Scripts appear as `scripts/<App>.UserScripts.<Name>__<hash>.js`. The repo has a script that finds, downloads and compares it:

```bash
bash .claude/skills/publish-pattern-odc/verify-script.sh https://<your-app-url> GreetingCard greeting-card/dist/GreetingCard.js
```

Or by hand:

```bash
APP=https://<your-app-url>
curl -s "$APP/moduleservices/moduleinfo" | grep -o '/[^"]*UserScripts\.GreetingCard[^"]*\.js'
curl -s -o published.js "https://<your-host>/<that path>"

# strip the BOM ODC adds, then compare (diff will also note the missing final newline)
sed '1s/^\xEF\xBB\xBF//' published.js | diff dist/GreetingCard.js -
```

What we measured on four of those publishes (pure-ASCII bundles; each update was sent as a full replacement of the Script):

| | First publish | `ExtendedClass` update | BEM look-and-feel update | Style.md alignment |
|---|---|---|---|---|
| Local | 2,959 bytes, 80 lines | 3,127 bytes, 84 lines | 5,158 bytes, 138 lines | 5,233 bytes, 147 lines |
| Published | 2,961 bytes | 3,129 bytes | 5,160 bytes | 5,235 bytes |
| BOM added | **yes** (`EF BB BF`, +3 bytes) | **yes** | **yes** | **yes** |
| Final newline | **dropped** (−1 byte) | **dropped** | **dropped** | **dropped** |
| Line endings | LF | LF | LF | LF |
| Code | **identical**, line for line | **identical**, line for line | **identical**, line for line | **identical**, line for line |

The result was the same every time, including a publish not in the table (the main-container rule, which restored the 2,959-byte bundle), so it's repeatable for small files. The BEM update shows it also holds for a bundle carrying a 60-line CSS template literal; it took one Mentor turn for the Script and one to publish.

The container rule is visible in the compiled screen code too: `MountPoint`'s style compiles to `"greeting-card" + (extendedClassIn !== nullTextIdentifier() ? " " + extendedClassIn : "")`, recalculated whenever `ExtendedClass` changes. It's still cleaner than an earlier 21 KB bundle, which came back reindented, with CRLF line endings and one escape sequence inside a comment changed (`\xE7` became `\xE3`). The likely difference is size and content: a small, ASCII-only file with no escape sequences in it. Don't assume you'll get the clean result; always run the diff.

### 8b. The JS nodes are wired as you asked

Download the app's script chunks from the same manifest and search for your class:

```bash
grep -l "ClaudeTest.GreetingCard" *.js
```

In the matching chunk the three nodes compile to small functions. What we found:

```js
function re(r){ r.Instance && r.Instance.destroy() }
function ie(r){ r.Instance && r.Instance.onParametersChanged({name:r.Name, buttonLabel:r.ButtonLabel}) }
function ae(r,n){ r.Instance = new ClaudeTest.GreetingCard({runtimeId:r.RuntimeId, name:r.Name,
  buttonLabel:r.ButtonLabel, events:{OnGreetClicked:n.TriggerGreetClicked}}) }
```

Check four things: the guards survived (the compiler rewrites `if (x) { … }` as `x && …`, which is equivalent), every parameter name matches `types.ts`, **no** `extendedClass` reaches the JS nodes (the container owns it), and the event goes through the bridge action (`n.TriggerGreetClicked`), not the Block Event.

### 8c. It works in a real browser

Validation and the diff are static. Open the screen and click through what the harness was built for:

1. The card renders inside the Block with the starting name.
2. Each click shows the Info message with the count going up (proves the event made it back to OutSystems through the bridge).
3. Typing in the input updates the greeting live (proves `onParametersChanged`).
4. DevTools → Elements: the Block's main container has `greeting-card` plus whatever `ExtendedClass` the screen passes (and nothing extra when it passes none), and the card inside it has exactly `card greeting-card__body`. Every class you see inside the container is `greeting-card__*`, `greeting-card--*` or an OutSystems UI class.
5. DevTools → Console is clean.

## Platform limits we hit along the way

All of these cost a turn or a question.

| What happened | What to do |
|---|---|
| Mentor refused to load a **mobile app**: `Assets of type MobileApplication are not supported. Supported asset types are: WebApplication, Agent, Library, Workflow.` | Build the pattern in a web app or a library. Mobile apps have to be edited in ODC Studio |
| Publishing an app installed from a **sample/Forge** (flagged external in the app list) failed immediately with no reason given; the edit itself had worked | Do these experiments in an app you created. Creating one through the agent takes one call |
| Creating an app failed with `Portfolio ID is required.` | Pass the portfolio key; the environment list returns it |
| The template's Home screen required login | Ask for `AnonymousAccess = true` on the harness screen if colleagues should open it without signing in |
| The OAuth sign-in can't run inside a non-interactive agent session | Authenticate once from `/mcp` in Claude Code before asking for anything |
| The `outsystems:status-watcher` agent couldn't wait between polls (its `sleep` was blocked) | Poll the Mentor run yourself, with a background timer between polls |

## ODC checklist

1. Steps 1 to 5 of [Components.md](Components.md) done; `npm test` green; `dist/` committed.
2. One Mentor session: turn A (Script), turn B (Block: one bridge Client Action per Event, the main container's Style Classes), turn C (harness screen).
3. Publish; confirm the live revision with `env_app`.
4. Diff the Script, find the JS nodes, check the container's classes, click through in the browser.
5. Only then use the Block on real screens.

**In a library:** Mentor can edit libraries too, so the Script and Block can live in one that several apps consume. Libraries don't appear in an environment's deployed inventory, so verify through a consuming app.

## References

- [Components.md](Components.md): the idea, the rules and steps 1 to 5
- [Style.md](Style.md): the CSS rules for every pattern
- [OutSystems/outsystems-mcp](https://github.com/OutSystems/outsystems-mcp): the official MCP server and Claude Code plugin
