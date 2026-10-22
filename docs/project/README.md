# Project records

This project's own documents, as opposed to the factory's guide in [../guide/](../guide/):

- [Releases.md](Releases.md): every release, generated from `releases/` by `npm run release:record`; don't edit it
- run logs: what happened when something was done for the first time in this project, one file each (`<What>-<date>.md`)
- decisions that only apply to this project

What a log teaches that would hold in any project goes into the guide instead, usually [PlatformNotes.md](../guide/PlatformNotes.md).

## Status

- **Components:** CopyField, RelativeTime, Sparkline, ConfirmButton, ReadMore (2026-10-22), and GreetingCard, shipped as `components/greeting-card`: a copy of the template (`templates/greeting-card`), refactored to the current rules (translatable text, the `AIOutsystemsFED` namespace). Change both together; the template is what new components are copied from.
- **Run logs:** [FirstRun-2026-10-21.md](FirstRun-2026-10-21.md), GreetingCard into the Sandbox app.

## Next steps

1. Do the browser click-through (step 8c) on the Sandbox `GreetingCardTest` screen and add it to [the run log](FirstRun-2026-10-21.md)
2. Build the first real component (the namespace is set: `window.AIOutsystemsFED.<Component>`, since 2026-10-22)
