/*!
 * OutSystems front-end components
 * Built: 2026-10-15T10:13:31.915Z
 * Contains:
 *   components/greeting-card/dist/GreetingCard.js
 */
"use strict";

// ---- components/greeting-card/dist/GreetingCard.js ----
;(() => {
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
      this.root = document.createElement("div");
      this.root.className = "card greeting-card__body";
      const text = document.createElement("div");
      text.className = "greeting-card__text";
      this.title = document.createElement("p");
      this.title.className = "greeting-card__title";
      this.countLabel = document.createElement("span");
      this.countLabel.className = "greeting-card__count";
      text.append(this.title, this.countLabel);
      this.button = document.createElement("button");
      this.button.type = "button";
      this.button.className = "btn btn-primary greeting-card__button";
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
