---
name: 'Component styles'
description: 'Use when writing or reviewing a component stylesheet (SCSS or CSS).'
applyTo: '{components,templates}/*/style/**'
---

# Component styles

Follow [Style.md](../../docs/guide/Style.md); `npm test` checks most of it on the compiled CSS.

- Class names are BEM under the component's block: `<block>`, `<block>__<element>`, `<block>--<modifier>`, states `<block>--is-<state>`. Elements are flat: never `<block>__a__b`.
- A selector is one BEM class, prefixed at most by a modifier or state of the same block, or by one OutSystems UI context class (`.phone`, `.tablet`, `.desktop`, `.is-rtl`, `.has-accessible-features`, …). No ids, no element selectors, no OutSystems UI widget classes (`.card`, `.btn`), no `!important`.
- Every colour, space, radius, border, shadow and font value is an OutSystems UI variable with its exact base-theme value as fallback: `var(--space-base, 16px)`. Take the values from Style.md's table; the tests read the real ones from the `outsystems-ui` package. Raw values only where OutSystems UI has none (line-height, durations, transforms), never a colour.
- Widths switch on `.phone` / `.tablet`, never width media queries. Logical properties only (`padding-inline-start`, `inset-inline-start`, `text-align: start`).
- Don't style focus or remove outlines; give every transition or animation a `prefers-reduced-motion` override.
- SCSS only groups the block's rules (Rule 8): nest with `&__element`, `&:hover`, `&--modifier &__element`, `.phone &__element`. No Sass variables or functions for visual values, no `@extend`, `@use` not `@import`, one reduced-motion `@media` at block level. Don't put declarations on the block itself.
- A new or removed modifier also goes in `component.json`'s `modifiers`; `check-contracts` fails otherwise.
