"use strict";
(() => {
  // src/greeting-card/GreetingCard.ts
  var DEFAULTS = {
    name: "",
    buttonLabel: "Greet",
    greeting: "Hello, {name}!",
    fallbackName: "there",
    countLabel: "Greeted {count} times",
    countLabelOne: "Greeted 1 time"
  };
  var fill = (template, values) => Object.keys(values).reduce((text, key) => text.split(`{${key}}`).join(values[key]), template);
  var GreetingCard = class {
    constructor(config) {
      this.params = { ...DEFAULTS };
      this.count = 0;
      this.destroyed = false;
      this.handleClick = () => {
        this.count += 1;
        this.render();
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
      this.onParametersChanged(config);
    }
    /** Called from the Block's OnParametersChanged handler. Partial updates keep the rest, and the count. */
    onParametersChanged(params) {
      if (this.destroyed) return;
      for (const key of Object.keys(DEFAULTS)) {
        if (params[key] !== void 0) this.params[key] = params[key] || DEFAULTS[key];
      }
      this.render();
    }
    /** Called from the Block's OnDestroy handler. */
    destroy() {
      if (this.destroyed) return;
      this.destroyed = true;
      this.button.removeEventListener("click", this.handleClick);
      this.root.remove();
    }
    // Platform data enters the DOM through textContent only, never innerHTML.
    render() {
      const p = this.params;
      this.title.textContent = fill(p.greeting, { name: p.name || p.fallbackName });
      this.button.textContent = p.buttonLabel;
      this.countLabel.textContent = fill(this.count === 1 ? p.countLabelOne : p.countLabel, { count: String(this.count) });
    }
  };

  // factory-entry.js
  var w = window;
  var ns = w["AIOutsystemsFED"] = w["AIOutsystemsFED"] || {};
  ns.GreetingCard = GreetingCard;
  if (!ns.__release) ns.__release = "dev";
})();
