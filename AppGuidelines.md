# App guidelines

Rules for building screens in our OutSystems apps, on O11 and ODC. They sit alongside [Style.md](Style.md), which covers the CSS of custom patterns, and [Components.md](Components.md), which covers building the patterns themselves. These rules cover the app around them: screens, layouts, and how they're assembled.

Each rule says what to do, why, and how to check it. Add new rules at the end, numbered.

## Rule 1: screens use `LayoutTopMenu`, not `LayoutBlank`

Every app screen is built inside the **`Layouts\LayoutTopMenu`** block. Don't put screen content in `LayoutBlank`.

**Why:**

- **The app keeps one header.** `LayoutTopMenu` already renders the app's logo and name (`Common\ApplicationTitle`), the mobile menu icon (`Common\MenuIcon`) and a navigation slot. A screen on `LayoutBlank` has to rebuild all of that, and each copy drifts.
- **It's the base theme's structure.** The layout brings OutSystems UI's page classes (`layout layout-top`, `header`, `main-content`, `content-bottom`), the fixed header, and the accessibility features (skip-to-content link, `has-accessible-features`), so screens behave like the rest of OutSystems UI.
- **Changing it later costs a rebuild.** The two layouts name their placeholders differently (`LayoutBlank` has `Content`; `LayoutTopMenu` has `MainContent`), so switching layout doesn't carry a screen's content across. The screen's content has to be re-created in the new placeholders. Choose the right layout when the screen is created.

**Where things go:**

| Placeholder | Put here | Leave empty when |
|---|---|---|
| `Header` | The app's navigation: `Common\Menu`, or the screen's nav links and header buttons | Never: the header is the app's navigation |
| `Breadcrumbs` | OutSystems UI `Breadcrumbs` for screens deeper than the first level | The screen is a top-level page |
| `Title` | The screen's title (styled `heading1` by the layout) | The screen has its own hero or headline in `MainContent` |
| `Actions` | The screen's main buttons, aligned with the title | There are no screen-level actions |
| `MainContent` | Everything else: the screen's sections, as named containers | Never |
| `Footer` | Content shared across screens, such as legal links | There's no footer |

- **Don't rebuild the header in `MainContent`.** No logo, app name or top navigation inside the page content; the layout has them.
- **Leave the layout's inputs at their defaults** (`HasFixedHeader = True`) unless the screen has a reason to differ, and say why in the screen's description.

**Exceptions:** the template's own `Login` and `InvalidPermissions` screens in `Common` keep the layout they ship with. A screen that genuinely has no app chrome (a print view, a page embedded somewhere else) can use `LayoutBlank`; say so in the screen's description.

**How to check:** in Service Studio, the screen's top widget is a `LayoutTopMenu` block instance. With the agent, read the screen and check that its first widget's source block is `LayoutTopMenu` and that its content sits in `MainContent`. In the published app, the screen's compiled file (`scripts/<App>.<Flow>.<Screen>.mvc.js`) references `LayoutTopMenu` and not `LayoutBlank`.

**Measured on:** the `Wireframe` screen of the O11 Sandbox app. It was first built on `LayoutBlank`, then rebuilt on `LayoutTopMenu`: the logo container was dropped (the layout's app title replaces it), the nav links and Contact button went to `Header`, and the five content sections went to `MainContent`. After publishing, the compiled screen referenced `LayoutTopMenu` and no longer `LayoutBlank`.
