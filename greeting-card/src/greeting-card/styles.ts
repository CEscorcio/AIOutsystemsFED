// Component look and feel, written to the rules in Style.md.
//
// - Base theme is OutSystems UI. Every colour, space, radius, border, shadow
//   and font value is an OutSystems UI variable; the fallback after the comma
//   is that variable's exact value in the base theme (OutSystems UI 2.30.0),
//   so the local preview matches an unthemed app.
// - Class names are BEM under the block greeting-card:
//     elements  greeting-card__body, __text, __title, __count, __button
//     modifiers greeting-card--compact   (passed by a screen through ExtendedClass)
// - Selectors are single BEM classes. Allowed prefixes: a modifier of this
//   block, or an OutSystems UI context class (.phone, .tablet, .is-rtl, ...).
// - Focus is left to OutSystems UI (.has-accessible-features); don't restyle it.
const STYLE_ID = "greeting-card-styles";

const CSS = `
.greeting-card__body {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-base, 16px);
  flex-wrap: wrap;
  padding: var(--space-base, 16px) var(--space-m, 24px);
  padding-inline-start: calc(var(--space-m, 24px) + var(--border-size-l, 3px));
  background-color: var(--color-neutral-0, #ffffff);
  border: var(--border-size-s, 1px) solid var(--color-neutral-4, #dee2e6);
  border-radius: var(--border-radius-soft, 4px);
  box-shadow: var(--shadow-xs, 0 1px 2px rgba(0, 0, 0, .1));
  overflow: hidden;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}
.greeting-card__body::before {
  content: "";
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  width: var(--border-size-l, 3px);
  background-color: var(--color-primary, #1068eb);
}
.greeting-card__body:hover {
  border-color: var(--color-neutral-5, #ced4da);
  box-shadow: var(--shadow-s, 0 2px 4px rgba(0, 0, 0, .1));
}
.greeting-card__text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-xs, 4px);
  min-width: 0;
}
.greeting-card__title {
  margin: 0;
  font-size: var(--font-size-h5, 20px);
  font-weight: var(--font-semi-bold, 600);
  line-height: 1.3;
  color: var(--color-neutral-9, #272b30);
  overflow-wrap: anywhere;
}
.greeting-card__count {
  display: inline-flex;
  align-items: center;
  padding: var(--space-none, 0) var(--space-s, 8px);
  border-radius: var(--border-radius-rounded, 100px);
  font-size: var(--font-size-xs, 12px);
  font-weight: var(--font-semi-bold, 600);
  line-height: 1.75;
  color: var(--color-primary, #1068eb);
  background-color: var(--color-primary-selected, rgba(20, 110, 245, .12));
  background-color: color-mix(in srgb, var(--color-primary, #1068eb) 12%, transparent);
}
.greeting-card__button {
  flex-shrink: 0;
  transition: transform 0.15s ease;
}
.greeting-card__button:hover { transform: translateY(-1px); }
.greeting-card__button:active { transform: none; }
.greeting-card--compact .greeting-card__body {
  padding: var(--space-s, 8px) var(--space-base, 16px);
  padding-inline-start: calc(var(--space-base, 16px) + var(--border-size-l, 3px));
}
.greeting-card--compact .greeting-card__title { font-size: var(--font-size-base, 16px); }
.phone .greeting-card__button { width: 100%; }
@media (prefers-reduced-motion: reduce) {
  .greeting-card__body, .greeting-card__button { transition: none; }
  .greeting-card__button:hover { transform: none; }
}
`;

/** Injects the component styles into <head> once, however many instances exist. */
export function ensureStyles(doc: Document): void {
  if (doc.getElementById(STYLE_ID)) return;
  const style = doc.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  doc.head.appendChild(style);
}
