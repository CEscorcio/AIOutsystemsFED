# Project records

This project's own documents, as opposed to the factory's guide in [../guide/](../guide/):

- [Releases.md](Releases.md): every release, generated from `releases/` by `npm run release:record`; don't edit it
- run logs: what happened when something was done for the first time in this project, one file each (`<What>-<date>.md`)
- decisions that only apply to this project

What a log teaches that would hold in any project goes into the guide instead, usually [PlatformNotes.md](../guide/PlatformNotes.md).

## Status

- **Components:** none shipped yet. GreetingCard became the template in `templates/` (2026-10-21), so `npm run build:all` refuses to make a release until `components/` has one. The Sandbox app keeps release 2026.43.1; a release without GreetingCard records its removal as breaking.
- **Run logs:** [FirstRun-2026-10-21.md](FirstRun-2026-10-21.md), GreetingCard into the Sandbox app.

## Next steps

1. Do the browser click-through (step 8c) on the Sandbox `GreetingCardTest` screen and add it to [the run log](FirstRun-2026-10-21.md)
2. Build the first real component (the namespace is set: `window.AIOutsystemsFED.<Component>`, since 2026-10-22)
