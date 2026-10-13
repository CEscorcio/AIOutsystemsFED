// Component layout only; colours and the button come from OutSystems UI
// (card, btn, btn-primary) so the component follows the app theme.
const STYLE_ID = "gc-greeting-card-styles";

const CSS = `
.gc-card { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.gc-text { display: flex; flex-direction: column; gap: 4px; }
.gc-title { font-size: 1.25rem; font-weight: 600; margin: 0; }
.gc-count { opacity: 0.7; font-size: 0.875rem; }
`;

/** Injects the component styles into <head> once, however many instances exist. */
export function ensureStyles(doc: Document): void {
  if (doc.getElementById(STYLE_ID)) return;
  const style = doc.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  doc.head.appendChild(style);
}
