// Component look and feel. Colours, radius, spacing and shadows come from
// OutSystems UI theme variables (with fallbacks for the local preview), and the
// card and button keep the OutSystems UI classes (card, btn, btn-primary), so
// the component follows the app theme.
//
// Selectors use two classes (.card.gc-card) to win over OutSystems UI's .card
// without !important. This sheet is injected last, so a screen that customises
// one instance through ExtendedClass needs one more class, e.g.
// .greeting-card.my-variant .gc-card { ... }
const STYLE_ID = "gc-greeting-card-styles";

const CSS = `
.card.gc-card {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-m, 16px);
  flex-wrap: wrap;
  padding: var(--space-m, 16px) var(--space-l, 24px);
  padding-left: calc(var(--space-l, 24px) + 4px);
  background: var(--color-neutral-0, #fff);
  border: var(--border-size-s, 1px) solid var(--color-neutral-4, #e2e8f0);
  border-radius: var(--border-radius-soft, 8px);
  box-shadow: var(--shadow-xs, 0 1px 2px rgba(15, 23, 42, 0.06));
  overflow: hidden;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}
.card.gc-card::before {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 4px;
  background: var(--color-primary, #1068eb);
}
.card.gc-card:hover {
  border-color: var(--color-neutral-5, #cbd5e1);
  box-shadow: var(--shadow-s, 0 4px 12px rgba(15, 23, 42, 0.08));
}
.gc-text { display: flex; flex-direction: column; align-items: flex-start; gap: var(--space-xs, 6px); min-width: 0; }
.gc-title {
  margin: 0;
  font-size: var(--font-size-h5, 1.25rem);
  font-weight: var(--font-semi-bold, 600);
  line-height: 1.3;
  color: var(--color-neutral-10, #1e293b);
  overflow-wrap: anywhere;
}
.gc-count {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: var(--font-size-xs, 0.75rem);
  font-weight: var(--font-semi-bold, 600);
  color: var(--color-primary, #1068eb);
  background: rgba(16, 104, 235, 0.1);
  background: color-mix(in srgb, var(--color-primary, #1068eb) 12%, transparent);
}
.gc-card .btn { flex-shrink: 0; transition: transform 0.15s ease, box-shadow 0.15s ease; }
.gc-card .btn:hover { transform: translateY(-1px); }
.gc-card .btn:active { transform: translateY(0); }
.gc-card .btn:focus-visible { outline: 2px solid var(--color-primary, #1068eb); outline-offset: 2px; }
@media (max-width: 480px) {
  .gc-card .btn { width: 100%; }
}
@media (prefers-reduced-motion: reduce) {
  .card.gc-card, .gc-card .btn { transition: none; }
  .gc-card .btn:hover { transform: none; }
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
