# Style rules for custom patterns

The CSS rules every custom pattern follows. The build guides ([Components.md](Components.md), then [Components_11.md](Components_11.md)) say *how* to build and ship a pattern; this page says how its CSS must be written. [`greeting-card/`](../components/greeting-card/) follows every rule here, and its `npm test` enforces the ones a script can check.

**The base theme is OutSystems UI** (`OutSystemsUI.css`). A pattern doesn't bring its own design system: it extends OutSystems UI, takes every visual value from its variables, and keeps working when an app's theme changes them.

## How the cascade is built

What a published app loads, in order (taken from the `moduleinfo` manifest of the test app):

| Order | Stylesheet | Owns |
|---|---|---|
| 1 | `OutSystemsUI.css` | The base theme: `:root` variables, reset, layout, widgets (`.card`, `.btn`, …), device and accessibility classes |
| 2 | The app's theme (Theme Editor, theme stylesheet) | Overrides of the variables: brand colours, fonts, spacing |
| 3 | The patterns' stylesheet (`dist/components.css`, or one component's `dist/<Name>.css`), placed in the app's theme stylesheet after the variable overrides | Each pattern's own look, built from those variables |

Because the patterns' stylesheet loads after `OutSystemsUI.css`, a single class selector is enough to win over an OutSystems UI rule of the same specificity. That is what lets the rules below ban `!important` and long selectors. Wherever you put it, it must load after `OutSystemsUI.css`.

Measured base: **OutSystems UI 2.30.0**, the version our O11 environment loads. Another environment may run an older OutSystems UI; check your version's `:root` before reusing the fallback values below.

## Rule 0, the golden rule: BEM class names

Every CSS class the pattern owns follows BEM, with the pattern class as the block. OutSystems UI follows the same convention in its own patterns (`osui-accordion-item__title--is-left`).

| BEM part | Form | GreetingCard | Who sets it |
|---|---|---|---|
| Block | `<pattern>` | `greeting-card` | The Block's main container, through its Style Classes |
| Element | `<pattern>__<element>` | `greeting-card__body`, `__text`, `__title`, `__count`, `__button` | The component's code |
| Modifier | `<pattern>--<modifier>`, `<pattern>__<element>--<modifier>` | `greeting-card--compact` | A screen, through `ExtendedClass` |
| State | `<pattern>--is-<state>`, `<pattern>__<element>--is-<state>` | (none yet) | The component's code, at runtime |

- **Lowercase kebab-case**, `__` before an element, `--` before a modifier. The block is the pattern name in kebab-case: `GreetingCard` → `greeting-card`.
- **Elements are flat.** `greeting-card__title`, never `greeting-card__text__title`, even when the title sits inside the text element.
- **States use `--is-*`**, as OutSystems UI does (`--is-open`, `--is-disabled`). The component adds and removes them; screens never set them.
- **No abbreviations or prefixes** (`gc-title`). The block name is what keeps classes unique.
- **The block name must not be an OutSystems UI class.** Don't name a pattern `card`, `tabs` or `popup`; its elements would collide with the base theme.
- **Files follow the block too.** The pattern's stylesheet is `style/<pattern>.scss`.

## Rule 1: OutSystems UI classes go next to the BEM class, never instead of it

The card root is `card greeting-card__body`; the button is `btn btn-primary greeting-card__button`.

- The OutSystems UI class brings the themed widget: background, border, button colours and states, and whatever the app's theme changes about them.
- The BEM class is the only thing the pattern's stylesheet targets.
- **Never restyle an OutSystems UI class** (`.card { … }`, `.btn-primary { … }`), not even scoped (`.greeting-card .card`). Target the BEM class, so the change stays inside the pattern and the base widget stays intact everywhere else.

## Rule 2: every visual value is an OutSystems UI variable

Colours, spacing, radius, border widths, shadows, font sizes and font weights come from OutSystems UI variables. When the app's theme changes the brand colour or the spacing scale, the pattern follows without a republish.

```css
/* yes */
padding: var(--space-base, 16px) var(--space-m, 24px);
color: var(--color-primary, #1068eb);

/* no */
padding: 16px 24px;
color: #1068eb;
```

- **Always write a fallback, and make it the variable's exact value in the base theme.** It's what the local preview shows, where OutSystems UI isn't loaded. A wrong fallback means the preview and the app look different (the first GreetingCard look had `var(--space-m, 16px)`, but `--space-m` is 24px).
- **Raw values are allowed only where OutSystems UI has no variable**: `line-height`, transition durations, `transform` offsets, percentages. Never for a colour.
- **Derived colours start from a variable.** A tint of the primary colour is `color-mix(in srgb, var(--color-primary, #1068eb) 12%, transparent)`, preceded by a line using the base theme's nearest token (`--color-primary-selected`) for browsers without `color-mix`.
- **Prefer the semantic token** to a palette colour: `--color-primary`, `--color-error`, `--color-success` before `--color-red`, `--color-green`.

### The variables we use, and their base values

From OutSystems UI 2.30.0's `:root`:

| Group | Variables |
|---|---|
| Brand | `--color-primary` `#1068eb`, `--color-secondary` `#303d60`, `--color-primary-hover` `#295fd6`, `--color-primary-selected` `rgba(20, 110, 245, .12)` |
| Neutrals | `--color-neutral-0` `#ffffff` … `-4` `#dee2e6`, `-5` `#ced4da`, `-6` `#adb5bd`, `-7` `#6a7178`, `-8` `#4f575e`, `-9` `#272b30`, `-10` `#101213` |
| Semantic | `--color-error` `#dc2020`, `--color-warning` `#e9a100`, `--color-success` `#29823b`, `--color-info` `#017aad`, each with a `-light` variant |
| Spacing | `--space-none` `0`, `--space-xs` `4px`, `--space-s` `8px`, `--space-base` `16px`, `--space-m` `24px`, `--space-l` `32px`, `--space-xl` `40px`, `--space-xxl` `48px` |
| Radius | `--border-radius-none` `0`, `--border-radius-soft` `4px`, `--border-radius-rounded` `100px`, `--border-radius-circle` `100%` |
| Border | `--border-size-none` `0`, `--border-size-s` `1px`, `--border-size-m` `2px`, `--border-size-l` `3px` |
| Shadow | `--shadow-xs` `0 1px 2px rgba(0, 0, 0, .1)`, `--shadow-s` `0 2px 4px …`, `--shadow-m` `0 4px 6px …`, `--shadow-l` `0 6px 8px …`, `--shadow-xl` `0 8px 10px …` |
| Font size | `--font-size-display` `36px`, `--font-size-h1` `32px` … `-h5` `20px`, `-h6` `18px`, `--font-size-base` `16px`, `--font-size-s` `14px`, `--font-size-xs` `12px`, `--font-size-label` `11px` |
| Font weight | `--font-light` `300`, `--font-regular` `400`, `--font-semi-bold` `600`, `--font-bold` `700` |
| Layers | `--layer-local-tier-1` … `-5` for stacking inside a pattern; `--layer-global-*` only for overlays |

To read the full list for your environment, download `OutSystemsUI.css` from your app's `/moduleservices/moduleinfo` and look at the first `:root` rule.

## Rule 3: selectors are one BEM class

```css
.greeting-card__title { … }                              /* yes */
.greeting-card--compact .greeting-card__title { … }      /* yes: a modifier of the block */
.phone .greeting-card__button { … }                      /* yes: an OutSystems UI context class */

.greeting-card .greeting-card__title { … }               /* no: the block adds nothing */
.greeting-card__text p { … }                             /* no: element selector */
#b1-MountPoint .card { … }                               /* no: id, and an OutSystems UI class */
```

- **No `!important`.** If a rule doesn't apply, the selector is wrong.
- **No ids, no element selectors, no OutSystems UI widget classes** in the pattern's selectors.
- **Two kinds of prefix are allowed**, and only these:
  - a modifier or state of the same block: `.greeting-card--compact .greeting-card__body`
  - an OutSystems UI context class: `.desktop`, `.tablet`, `.phone`, `.landscape`, `.portrait`, `.is-rtl`, `.has-accessible-features`, `.os-high-contrast`

## Rule 4: responsive through OutSystems UI device classes

OutSystems UI puts `.desktop`, `.tablet` or `.phone` on the page, and uses those classes itself for responsive layout. Patterns do the same, so they switch at the same breakpoints as the rest of the app:

```css
.phone .greeting-card__button { width: 100%; }
```

Media queries are only for user preferences (`prefers-reduced-motion`), never for widths.

## Rule 5: layout works right to left

OutSystems UI supports right-to-left languages by putting `.is-rtl` on the page. Write direction with logical properties so the pattern flips by itself:

| Instead of | Use |
|---|---|
| `padding-left`, `margin-right` | `padding-inline-start`, `margin-inline-end` |
| `left: 0` | `inset-inline-start: 0` |
| `top: 0; bottom: 0` | `inset-block: 0` |
| `text-align: left` | `text-align: start` |

Use `.is-rtl .greeting-card__… { … }` only for what logical properties can't express, such as mirroring an arrow icon.

## Rule 6: accessibility follows OutSystems UI

- **Don't style focus.** OutSystems UI owns it: with accessibility features on (`.has-accessible-features`) it draws its own focus ring in `--color-focus-outer`, and switches to an outline in high contrast. A pattern that adds its own ring draws a second one. Never remove an outline either (`outline: none`).
- **Respect reduced motion.** Every transition and animation has a `@media (prefers-reduced-motion: reduce)` override that turns it off.
- **Contrast comes from the tokens.** Text on `--color-neutral-0` uses `--color-neutral-7` or darker; text on a primary tint uses `--color-primary`. Don't put text on a colour the theme might change without checking both.
- **Hover is never the only signal.** Anything hover reveals must also be reachable by keyboard.

## Rule 7: where a pattern's CSS lives

| CSS | Where it goes |
|---|---|
| The pattern's own look | `components/<pattern>/style/<pattern>.scss`. The build compiles it to `dist/<Name>.css` ([Rule 8](#rule-8-scss-grouping-not-values)), and `npm run build:all` joins every pattern's stylesheet into `dist/components.css`, which starts with the build timestamp. The app loads it from its theme stylesheet |
| A variant one screen needs | A modifier in the pattern's stylesheet, chosen by the screen through `ExtendedClass` |
| A one-off adjustment on one screen | An OutSystems UI utility class in `ExtendedClass` (`margin-top-m`); otherwise a screen class targeting `.<the-screen-class> .greeting-card__…` in the screen's stylesheet |
| Brand colours, fonts, spacing for the whole app | The app's theme: change the OutSystems UI variables there, and every pattern follows |

- **The component's JavaScript adds no CSS.** Styles ship as a stylesheet of their own, separate from the Script. `npm test` checks that the component never injects a `<style>` or `<link>`.
- **Put it in the theme stylesheet, not the Block's.** On O11, edits to a non-empty Block stylesheet don't reliably reach the published CSS when made through the Service Studio MCP, while theme stylesheet edits did publish every time we tried. Paste `dist/components.css` into the theme stylesheet as one marked section, after Theme Editor's own block, and replace that section whole on each release. (Not yet done with a component stylesheet; record what happens in [Components_11.md](Components_11.md#the-stylesheet) the first time.)
- **Ship the stylesheet and the Script together.** A release is one `npm run build:all`: upload `dist/components.js` and `dist/components.css` from the same build, so their timestamps match.
- **Document every modifier** in `types.ts`, next to `ExtendedClass`. Modifiers are the pattern's public styling API; an undocumented one is a private class a screen shouldn't rely on.

## Rule 8: SCSS, grouping not values

A pattern's styles are written in SCSS (`style/<pattern>.scss`). The component's build compiles them with Dart Sass and formats the result with the repo's Prettier config, so `dist/<Name>.css` is flat CSS that reads like hand-written CSS. Plain `.css` files in `style/` still work; the build joins them with the compiled ones in alphabetical order.

SCSS is there to group a block's rules in one place, nothing more:

```scss
.greeting-card {
	&__body {
		padding: var(--space-base, 16px);

		&:hover { … }              // .greeting-card__body:hover
	}

	&--compact &__body { … }       // .greeting-card--compact .greeting-card__body
	.phone &__button { … }         // .phone .greeting-card__button

	@media (prefers-reduced-motion: reduce) {
		&__body { transition: none; }
	}
}
```

- **Every compiled selector still follows Rule 3.** Nest elements under the block with `&__element`, pseudo-classes with `&:hover`, and write a prefix as `&--modifier &__element` or `.phone &__element`. Never nest an element in another element: `&__title` inside `&__text` compiles to `greeting-card__text__title`, which breaks "elements are flat".
- **Don't style the block itself.** `.greeting-card { … }` only groups; a declaration on it would land on the Block's main container, which OutSystems owns.
- **Values are OutSystems UI variables, written out.** A Sass variable, function or calculation compiles to a fixed value that the app's theme can't change, so none of them produce a colour, space, radius, shadow or font value. `var(--space-base, 16px)` stays in the source as it is.
- **One reduced-motion `@media` at block level**, as above, so the compiled CSS has one override block.
- **No `@extend`** (it merges selectors from distant rules into comma lists that are hard to trace back) **and no `@import`** (deprecated; use `@use`). Mixins shared inside a pattern go in a partial, `style/_<name>.scss`, loaded with `@use`. Don't share partials between patterns; each pattern stays a folder you can copy.

**How it's checked.** stylelint lints the SCSS source as you type (`stylelint-config-standard-scss` plus the rules above). It can't resolve `&__suffix` class names, so a badly named nested element is only caught by `npm test`, which runs every check below on the compiled `dist/<Name>.css`. To find where a class is styled, search for its suffix (`__title`) in `style/`, or read the full names in `dist/<Name>.css`.

## What `npm test` checks

| Check | Rule |
|---|---|
| Every class the component renders is `<pattern>`, `<pattern>__*`, `<pattern>--*` or an allowed OutSystems UI class | 0, 1 |
| Every `var()` is a known OutSystems UI variable, with a fallback equal to its base-theme value | 2 |
| No raw colour (`#…`, `rgb()`, `hsl()`) outside a variable fallback | 2 |
| No `!important` | 3 |
| Every selector is one BEM class, prefixed at most by a modifier or state of the block, or by an OutSystems UI context class | 3 |
| No width media queries | 4 |
| No `left` / `right` properties, no `text-align: left` / `right` | 5 |
| No focus styles, no outline removal; a `prefers-reduced-motion` override when there are transitions or animations | 6 |
| The component adds no `<style>` or `<link>` to the page; its stylesheet is ASCII-only and has rules for the block's elements | 7 |

The checks read the compiled CSS, so they hold whether the source is SCSS or plain CSS.

`npm run build:all` adds a smoke test of the combined files before writing them: `components.js` loads and registers every component's class, and `components.css` has rules for every component and none outside their blocks. If any of that fails, nothing is written.

What stays for review: semantic token choice, contrast, hover-only interactions, and whether a modifier belongs in the pattern at all. The tests read every OutSystems UI variable and its value from the installed `outsystems-ui` package (`dist/O11.OutSystemsUI.css`, pinned in the root `package.json`), so there's no list to maintain. Many of these rules are also checked by stylelint (`.stylelintrc.json`) as you type, in an editor with the stylelint extension.

## Checklist for a new pattern

1. Block name in kebab-case, not an OutSystems UI class name.
2. Every element `<pattern>__<element>`, flat; variants `<pattern>--<modifier>`; states `--is-<state>`.
3. OutSystems UI classes next to the BEM class where a themed widget fits (`card`, `btn btn-primary`).
4. Every visual value an OutSystems UI variable, with its exact base value as fallback.
5. Selectors: one BEM class, prefixed only by a block modifier or an OutSystems UI context class. No `!important`, ids or element selectors.
6. Widths switch on `.phone` / `.tablet`, not media queries.
7. Logical properties for anything left or right.
8. No focus styles; a reduced-motion override for every transition.
9. Styles in `style/<pattern>.scss`, none in the JavaScript; modifiers documented in `types.ts`.
10. SCSS only groups rules: elements flat, no Sass variables for values, no `@extend`.
11. `npm test` green.
