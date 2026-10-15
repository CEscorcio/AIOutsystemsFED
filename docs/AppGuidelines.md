# App guidelines

Rules for building screens in our OutSystems 11 apps. They sit alongside [Style.md](Style.md), which covers the CSS of custom patterns, and [Components.md](Components.md), which covers building the patterns themselves. These rules cover the app around them: screens, layouts, and how they're assembled.

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
- **The `Header` placeholder already holds `Common\Menu`.** A new `LayoutTopMenu` instance comes with the menu in it. Don't add another one: the screen shows the menu twice. If the screen needs its own navigation instead, replace the menu rather than adding next to it.
- **Leave the layout's inputs at their defaults** (`HasFixedHeader = True`) unless the screen has a reason to differ, and say why in the screen's description.

**Exceptions:** the template's own `Login` and `InvalidPermissions` screens in `Common` keep the layout they ship with. A screen that genuinely has no app chrome (a print view, a page embedded somewhere else) can use `LayoutBlank`; say so in the screen's description.

**How to check:** in Service Studio, the screen's top widget is a `LayoutTopMenu` block instance. With the agent, read the screen and check that its first widget's source block is `LayoutTopMenu` and that its content sits in `MainContent`. In the published app, the screen's compiled file (`scripts/<App>.<Flow>.<Screen>.mvc.js`) references `LayoutTopMenu` and not `LayoutBlank`.

**Measured on:** the `Wireframe` screen of the O11 Sandbox app. It was first built on `LayoutBlank`, then rebuilt on `LayoutTopMenu`: the logo container was dropped (the layout's app title replaces it), the nav links and Contact button went to `Header`, and the five content sections went to `MainContent`. After publishing, the compiled screen referenced `LayoutTopMenu` and no longer `LayoutBlank`. On the `Design` screen, adding `Common\Menu` to a new instance's `Header` left two menus there, which is how the menu note above was found.

## Rule 2: new screens go in the `MainFlow` UI flow

Every new app screen is created in the **`MainFlow`** UI flow. Don't add screens to `Common`, `Layouts` or a new flow.

**Why:**

- **Each flow has one job.** The app template splits the module into three flows, and only one of them is for the app's own screens:

  | Flow | Holds | New screens? |
  |---|---|---|
  | `MainFlow` | The app's screens | **Yes** |
  | `Common` | The template's system screens (`Login`, `InvalidPermissions`) and shared blocks (`Menu`, `ApplicationTitle`, `UserInfo`, `MenuIcon`) | No |
  | `Layouts` | The layout blocks (`LayoutTopMenu`, `LayoutBlank`, `LayoutSideMenu`, …) | No |

- **One place to find screens.** Navigation, the default screen and screen-to-screen links are all set up in one flow, and nobody has to search the module for where a screen lives.
- **No accidental exposure.** Screens in `Common` sit next to the login and permissions screens, which are open to anonymous users. Keeping app screens out of there keeps their access settings a deliberate choice.

**How to apply:**

- **Place each new screen on the `MainFlow` canvas** next to the existing ones, not on top of them. Screens created through the agent all land at the same spot unless a position is set.
- **A separate flow only when asked.** If an app grows enough to need feature flows (for example `Orders`, `Admin`), that's a decision for the team, recorded here as a new rule. Until then, everything goes in `MainFlow`.

**How to check:** in Service Studio, the screen appears under **Interface → UI Flows → MainFlow**. With the agent, `getScreenNames` lists each screen with its `UIFlow`, which should be `MainFlow` for every screen except `Login` and `InvalidPermissions`.

**Measured on:** the O11 Sandbox app. The template created `Layouts`, `Common` and `MainFlow`, with `MainFlow` empty, and the `Wireframe` screen was created in `MainFlow`.

## Rule 3: style screens with OutSystems UI classes only

Screens get their layout, spacing, colours and type from OutSystems UI classes in each widget's **Style Classes**. Don't write CSS in the screen's or theme's stylesheet, and don't use a widget's inline style, unless OutSystems UI has no class for what's needed.

**Why:** the classes follow the app's theme, so a brand change in Theme Editor reaches every screen. They're the same classes the OutSystems UI patterns use, so screens and patterns look like one product. And there's no stylesheet to keep in sync (on O11, edits to an existing screen or block stylesheet don't reliably publish through the agent; see [Style.md](Style.md), Rule 7).

**The classes we use**, all present in OutSystems UI 2.30.0:

| For | Classes |
|---|---|
| Responsive columns | A container with `columns columns2` (or `columns3` … `columns6`) `gutter-base tablet-break-none phone-break-all`, whose children each have `columns-item` |
| Flex rows | `display-flex`, `align-items-center`, `justify-content-space-between` / `-center`, `flex-wrap`, `flex1`, `gap-s` / `gap-base` / `gap-m` |
| Spacing | `padding-base` / `-m` / `-xl`, `padding-x-none`, `padding-y-base`, `margin-top-s` / `-base` / `-m`, `margin-left-base` |
| Surfaces | `card` (white, border, radius, padding), `shadow-s`, `border-radius-soft`, `background-neutral-2` / `-3`, `background-violet` / `-teal` / `-green` / `-yellow` / … |
| Text | `heading1` … `heading6`, `font-size-s`, `font-semi-bold`, `text-neutral-0` (white), `text-neutral-7` (muted), `text-primary`, `text-align-center` / `-right` |
| List rows | `list-item` (divider line and padding) with `list-item-content` (flex row) and a `list-item-content-center` child that takes the free space; `list-item-no-hover` for rows that aren't clickable |
| Avatars and image placeholders | `avatar avatar-medium` (a 40 px circle) with a `background-*` colour; add `border-radius-soft` for a rounded square |
| Icons | A container with `fa fa-<icon>`; `fa-lg` for size, a `text-*` class for colour |
| Buttons | `btn` (secondary), `btn btn-primary` (primary) |

**What OutSystems UI can't do**, and what to do instead:

- **Gradients and decorative borders** (for example a coloured line along a card's top): use the flat theme colour and drop the decoration, or agree it as a pattern with CSS written to [Style.md](Style.md).
- **Fixed sizes for image placeholders**: prefer `avatar` classes, which have fixed sizes. If a size really has no class, an inline style on that one widget is acceptable; say so in the widget's name or the screen's description.
- **Colour in data** (chart series, status colours): store OutSystems UI palette values in a static entity attribute, both as a hex value for charts and as a `text-*` / `background-*` class for widgets.

**How to check:** no screen or theme stylesheet has rules for the screen, and its widgets' Style Classes use only classes from the table above.

**Measured on:** the O11 Sandbox `Design` screen, a dashboard built from a reference design with containers and these classes only, no CSS. The OutSystems UI version was read from the stylesheet the app loads, and each class was checked against it.

## Rule 4: unwired buttons and links point to `PlaceholderClick`

When a screen has buttons or links whose behaviour isn't built yet, give the screen an empty screen action named **`PlaceholderClick`**, with a description saying so, and point every unwired button and link at it.

**Why:** OutSystems requires every button and link to have an On Click destination; leaving it empty is a validation error, and the module can't be published. One clearly named action makes the unfinished parts easy to find: a search for `PlaceholderClick` lists everything still to wire up.

**How to check:** `PlaceholderClick` has no logic besides Start and End. Before a screen is called done, nothing points at it any more and it's deleted.

**Measured on:** the O11 Sandbox `Wireframe` and `Design` screens, which publish with their buttons and links pointing at `PlaceholderClick`.

## Rule 5: name every container after its role

Give every container a name that says what it is in the design: `Hero`, `OrderCounters`, `LastOrdersHeader`, `Service1Image`. Use PascalCase, and don't leave containers unnamed.

**Why:** the widget tree in Service Studio then reads like the design, so anyone can find the part of the screen they need without clicking through anonymous containers. The names are also what an agent uses to find and edit a section later.

- **Name after the role, not the look:** `OrderCounters`, not `PurpleBoxes`. A style changes; the role doesn't.
- **Sections first, then parts:** `TotalSales` → `TotalSalesHeader` → `TotalSalesTitle`.
- **Repeated items get a number or come from a list:** `Service1`, `Service2`, `Service3`, or a List widget with one named row template (`OrderRow`).

**How to check:** in Service Studio's widget tree, every container under `MainContent` has a name.

**Measured on:** the O11 Sandbox `Wireframe` and `Design` screens.
