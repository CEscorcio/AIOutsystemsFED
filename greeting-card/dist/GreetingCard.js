"use strict";
(() => {
  // src/greeting-card/styles.ts
  var STYLE_ID = "gc-greeting-card-styles";
  var CSS = `
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
  function ensureStyles(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    const style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CSS;
    doc.head.appendChild(style);
  }

  // src/greeting-card/GreetingCard.ts
  var GreetingCard = class {
    constructor(config) {
      this.count = 0;
      this.destroyed = false;
      this.handleClick = () => {
        this.count += 1;
        this.renderCount();
        if (this.events.OnGreetClicked) this.events.OnGreetClicked(this.count);
      };
      const mount = document.getElementById(config.runtimeId);
      if (!mount) {
        throw new Error(`GreetingCard: mount element "${config.runtimeId}" not found`);
      }
      this.mount = mount;
      this.events = config.events || {};
      ensureStyles(document);
      this.root = document.createElement("div");
      this.root.className = "card gc-card";
      const text = document.createElement("div");
      text.className = "gc-text";
      this.title = document.createElement("p");
      this.title.className = "gc-title";
      this.countLabel = document.createElement("span");
      this.countLabel.className = "gc-count";
      text.append(this.title, this.countLabel);
      this.button = document.createElement("button");
      this.button.type = "button";
      this.button.className = "btn btn-primary";
      this.button.addEventListener("click", this.handleClick);
      this.root.append(text, this.button);
      this.mount.replaceChildren(this.root);
      this.applyParameters(config);
      this.renderCount();
    }
    /** Called from the Block's OnParametersChanged handler. */
    onParametersChanged(params) {
      if (this.destroyed) return;
      this.applyParameters(params);
    }
    /** Called from the Block's OnDestroy handler. */
    destroy() {
      if (this.destroyed) return;
      this.destroyed = true;
      this.button.removeEventListener("click", this.handleClick);
      this.root.remove();
    }
    // Platform data enters the DOM through textContent only, never innerHTML.
    applyParameters(params) {
      if (params.name !== void 0) this.title.textContent = `Hello, ${params.name || "there"}!`;
      if (params.buttonLabel !== void 0) this.button.textContent = params.buttonLabel || "Greet";
    }
    renderCount() {
      this.countLabel.textContent = this.count === 1 ? "Greeted 1 time" : `Greeted ${this.count} times`;
    }
  };

  // src/index.ts
  var w = window;
  w.ClaudeTest = w.ClaudeTest || {};
  w.ClaudeTest.GreetingCard = GreetingCard;
})();
