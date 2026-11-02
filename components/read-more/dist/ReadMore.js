"use strict";
(() => {
  // src/read-more/ReadMore.ts
  var DEFAULT_LINES = 3;
  var nextId = 0;
  var ReadMore = class {
    constructor(config) {
      this.params = { text: "", lines: DEFAULT_LINES, moreLabel: "Show more", lessLabel: "Show less" };
      this.expanded = false;
      this.destroyed = false;
      this.handleToggle = () => {
        if (this.destroyed) return;
        this.expanded = !this.expanded;
        this.render();
        if (this.events.OnToggled) this.events.OnToggled(this.expanded);
      };
      const mount = document.getElementById(config.runtimeId);
      if (!mount) throw new Error(`ReadMore: mount element "${config.runtimeId}" not found`);
      this.mount = mount;
      this.events = config.events || {};
      this.text = document.createElement("p");
      this.text.className = "read-more__text";
      this.text.id = `read-more-${config.runtimeId}-${nextId += 1}`;
      this.toggle = document.createElement("button");
      this.toggle.type = "button";
      this.toggle.className = "read-more__toggle";
      this.toggle.setAttribute("aria-controls", this.text.id);
      this.toggle.addEventListener("click", this.handleToggle);
      this.mount.replaceChildren(this.text, this.toggle);
      this.onParametersChanged(config);
    }
    /** Called from the Block's OnParametersChanged handler. */
    onParametersChanged(params) {
      if (this.destroyed) return;
      if (params.text !== void 0) this.params.text = params.text || "";
      if (params.lines !== void 0) this.params.lines = params.lines > 0 ? Math.floor(params.lines) : DEFAULT_LINES;
      if (params.moreLabel !== void 0) this.params.moreLabel = params.moreLabel || "Show more";
      if (params.lessLabel !== void 0) this.params.lessLabel = params.lessLabel || "Show less";
      this.text.textContent = this.params.text;
      this.render();
    }
    /** Called from the Block's OnDestroy handler. */
    destroy() {
      if (this.destroyed) return;
      this.destroyed = true;
      this.toggle.removeEventListener("click", this.handleToggle);
      this.text.remove();
      this.toggle.remove();
    }
    /** True while the text is shown in full. */
    get isExpanded() {
      return this.expanded;
    }
    render() {
      this.text.classList.toggle("read-more__text--is-clamped", !this.expanded);
      this.text.style.setProperty("-webkit-line-clamp", this.expanded ? "" : String(this.params.lines));
      this.toggle.textContent = this.expanded ? this.params.lessLabel : this.params.moreLabel;
      this.toggle.setAttribute("aria-expanded", String(this.expanded));
      const measured = this.text.clientHeight > 0;
      const fits = !this.expanded && measured && this.text.scrollHeight <= this.text.clientHeight + 1;
      this.toggle.hidden = !this.params.text || fits;
    }
  };

  // factory-entry.js
  var w = window;
  var ns = w["AIOutsystemsFED"] = w["AIOutsystemsFED"] || {};
  ns.ReadMore = ReadMore;
  if (!ns.__release) ns.__release = "dev";
})();
