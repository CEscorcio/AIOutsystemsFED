# Project records

This project's own documents, as opposed to the factory's guide in [../guide/](../guide/):

- [Releases.md](Releases.md): every release, generated from `releases/` by `npm run release:record`; don't edit it
- run logs: what happened when something was done for the first time in this project, one file each (`<What>-<date>.md`)
- decisions that only apply to this project

What a log teaches that would hold in any project goes into the guide instead, usually [PlatformNotes.md](../guide/PlatformNotes.md).

## Status

- **Components:** CopyField, RelativeTime, Sparkline, ConfirmButton, ReadMore (2026-10-22), and GreetingCard, shipped as `components/greeting-card`: a copy of the template (`templates/greeting-card`), refactored to the current rules (translatable text, the `AIOutsystemsFED` namespace). Change both together; the template is what new components are copied from.
- **Released:** 2026.43.2, all six components, in the Sandbox app (personal environment), with a `<Name>Test` screen each ([Releases.md](Releases.md)).
- **Run logs:**
  - [FirstRun-2026-10-21.md](FirstRun-2026-10-21.md): GreetingCard into the Sandbox app, by hand.
  - [GeneratorRun-2026-10-22.md](GeneratorRun-2026-10-22.md): all six from the generators.

## Next steps

1. Do the browser click-through (step 8c) on the six Sandbox test screens and add it to [the generator run log](GeneratorRun-2026-10-22.md)
2. The Sandbox test screens for RelativeTime, Sparkline and ConfirmButton predate the Checkbox for Boolean inputs; recreate them from the generator if Live, ShowLast or IsDisabled need testing there
3. Use the Blocks on a real screen
