# Generator run: 2026-10-22

Release 2026.43.2 into the Sandbox app on the personal environment. This was the first time every OutSystems element came from `npm run o11:generate` instead of a hand-written request. What holds in any project is in [PlatformNotes.md](../guide/PlatformNotes.md); this is the log.

## What was done

Every step except the deletions ran from a generated file, passed to `applyModelApiCode` unchanged. Each step was dry-run (with its probe), applied, and merged on its own.

| Step | Probe result |
|---|---|
| Deleted the old `GreetingCardTest` screen and `GreetingCard` Block | (removed so the generator could create them again) |
| Script `Components` replaced with 2026.43.2 | `len=20249`, the expected checksum |
| Theme `Sandbox`: the 2026.43.1 section replaced between its markers | before: one section, 2026.43.1; after: `sections=1 len=9934`, the expected checksum |
| Blocks GreetingCard, CopyField, RelativeTime, Sparkline, ConfirmButton, ReadMore | inputs, events, actions and Script as the generator printed |
| Screens `<Name>Test` for each, in `MainFlow` on `LayoutTopMenu`, role Registered | variables and handlers as the generator printed |
| Publish | Uploading, Compiling, Deploying, Done |

## What went wrong

**CopyField's first dry run.** The probe line matched, but the validation messages had a new warning: "Input Parameter 'Value2' is never used in Client Action 'TriggerCopied'". The event parameter `Value` has the same name as the Block input `Value`. Service Studio renamed the action's parameter, so the Trigger node's `Value` read the Block input instead. The generator was fixed (`Event<Name>`, passed by its actual name), regenerated, and the second dry run was clean. GreetingCard (`Count`) and ReadMore (`IsExpanded`) don't collide.

**Downloading the served files** stalled once without a timeout; `curl --max-time 30` per file worked.

## Verified

From `/<App>/moduleservices/moduleinfo`:

- The Script is identical to `dist/components.js` once the BOM is removed.
- The theme has one components section, identical to `dist/components.css` once line endings are normalised.
- Each of the six compiled Blocks creates `AIOutsystemsFED.<Class>`, calls `onParametersChanged` and `destroy`, and refers to its Trigger actions.
- Each of the six test screens uses its Block.

**Not verified:** the browser click-through (step 8c). The test screens also give Boolean inputs (Live, ShowLast, IsDisabled) no control, so those inputs stay at their defaults there.
