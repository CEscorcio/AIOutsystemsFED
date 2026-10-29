# Project records

This project's own documents, as opposed to the factory's guide in [../guide/](../guide/):

- [Releases.md](Releases.md): every release, generated from `releases/` by `npm run release:record`; don't edit it
- run logs: what happened when something was done for the first time in this project, one file each (`<What>-<date>.md`)
- decisions that only apply to this project

What a log teaches that would hold in any project goes into the guide instead, usually [PlatformNotes.md](../guide/PlatformNotes.md).

## Status

- **Components:** CopyField, RelativeTime, Sparkline, ConfirmButton, ReadMore (2026-10-22), and GreetingCard, shipped as `components/greeting-card`: a copy of the template (`templates/greeting-card`), refactored to the current rules (translatable text, the `AIOutsystemsFED` namespace). Change both together; the template is what new components are copied from.
- **Components (2026-10-28):** DropdownButton, a split button with a Menu placeholder.
- **Released** ([Releases.md](Releases.md)):
  - 2026.43.2: the six components, in the Sandbox app (Reactive, personal environment), with a `<Name>Test` screen each; its Blocks are in the `Patterns` flow.
  - 2026.44.1: all seven, in the SGLiveStyleGuideTraditional_SandBox module (Traditional Web, "styleguide"): `ComponentsScript`, the theme section, `DropdownButtonPattern` and the `DropdownBTN` screen. Published; the served files and the browser click-through are not verified.
- **Run logs:**
  - [FirstRun-2026-10-21.md](FirstRun-2026-10-21.md): GreetingCard into the Sandbox app, by hand.
  - [GeneratorRun-2026-10-22.md](GeneratorRun-2026-10-22.md): all six from the generators.

## Next steps

1. Open `DropdownBTN` in SGLiveStyleGuideTraditional_SandBox in a browser: buttons render, the chevron opens the menu, a click shows the feedback message, Disabled doesn't react. Check the served theme CSS against `dist/components.css` (the app's URL is needed)
2. Put 2026.44.1 (with DropdownButton) in the Sandbox app too: Script, theme, `npm run o11:generate -- block dropdown-button` and `-- showcase dropdown-button`
3. Do the browser click-through (step 8c) on the six Sandbox test screens and add it to [the generator run log](GeneratorRun-2026-10-22.md)
4. The Sandbox test screens for RelativeTime, Sparkline and ConfirmButton predate the Checkbox for Boolean inputs; recreate them from the generator if Live, ShowLast or IsDisabled need testing there
5. Use the Blocks on a real screen
