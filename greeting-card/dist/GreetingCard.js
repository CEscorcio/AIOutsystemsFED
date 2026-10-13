"use strict";
(() => {
  // src/greeting-card/styles.ts
  var STYLE_ID = "gc-greeting-card-styles";
  var CSS = `
.gc-card { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.gc-text { display: flex; flex-direction: column; gap: 4px; }
.gc-title { font-size: 1.25rem; font-weight: 600; margin: 0; }
.gc-count { opacity: 0.7; font-size: 0.875rem; }
`;
  function ensureStyles(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    const style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CSS;
    doc.head.appendChild(style);
  }

  // src/greeting-card/GreetingCard.ts
  var ROOT_CLASS = "card gc-card";
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
      this.root.className = ROOT_CLASS;
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
      if (params.extendedClass !== void 0) {
        this.root.className = `${ROOT_CLASS} ${params.extendedClass || ""}`.trim();
      }
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
