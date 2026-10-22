"use strict";
(() => {
  // src/copy-field/CopyField.ts
  var CONFIRM_MS = 2e3;
  var CopyField = class {
    constructor(config) {
      this.params = { value: "", label: "", copyLabel: "Copy", copiedLabel: "Copied" };
      this.confirmTimer = null;
      this.destroyed = false;
      this.handleClick = () => {
        const value = this.params.value;
        if (!value || this.destroyed) return;
        const done = () => this.confirm(value);
        const clipboard = navigator.clipboard;
        if (clipboard && typeof clipboard.writeText === "function") {
          const result = clipboard.writeText(value);
          if (result && typeof result.then === "function") result.then(done, () => this.fallbackCopy(value) && done());
          else done();
        } else if (this.fallbackCopy(value)) done();
      };
      const mount = document.getElementById(config.runtimeId);
      if (!mount) throw new Error(`CopyField: mount element "${config.runtimeId}" not found`);
      this.mount = mount;
      this.events = config.events || {};
      this.root = document.createElement("div");
      this.root.className = "copy-field__body";
      this.label = document.createElement("span");
      this.label.className = "copy-field__label";
      const row = document.createElement("div");
      row.className = "copy-field__row";
      this.valueEl = document.createElement("code");
      this.valueEl.className = "copy-field__value";
      this.button = document.createElement("button");
      this.button.type = "button";
      this.button.className = "btn btn-small copy-field__button";
      this.button.addEventListener("click", this.handleClick);
      this.status = document.createElement("span");
      this.status.className = "wcag-hide-text copy-field__status";
      this.status.setAttribute("aria-live", "polite");
      row.append(this.valueEl, this.button);
      this.root.append(this.label, row, this.status);
      this.mount.replaceChildren(this.root);
      this.onParametersChanged(config);
    }
    /** Called from the Block's OnParametersChanged handler. */
    onParametersChanged(params) {
      if (this.destroyed) return;
      for (const key of ["value", "label", "copyLabel", "copiedLabel"]) {
        if (params[key] !== void 0) this.params[key] = params[key] || "";
      }
      if (!this.params.copyLabel) this.params.copyLabel = "Copy";
      if (!this.params.copiedLabel) this.params.copiedLabel = "Copied";
      this.label.textContent = this.params.label;
      this.label.hidden = !this.params.label;
      this.valueEl.textContent = this.params.value;
      this.button.disabled = !this.params.value;
      this.button.setAttribute("aria-label", this.params.label ? `${this.params.copyLabel}: ${this.params.label}` : this.params.copyLabel);
      if (!this.confirmTimer) this.button.textContent = this.params.copyLabel;
    }
    /** Called from the Block's OnDestroy handler. */
    destroy() {
      if (this.destroyed) return;
      this.destroyed = true;
      if (this.confirmTimer) clearTimeout(this.confirmTimer);
      this.button.removeEventListener("click", this.handleClick);
      this.root.remove();
    }
    fallbackCopy(value) {
      const range = document.createRange();
      range.selectNodeContents(this.valueEl);
      const selection = window.getSelection();
      if (!selection) return false;
      selection.removeAllRanges();
      selection.addRange(range);
      try {
        return value.length > 0 && typeof document.execCommand === "function" && document.execCommand("copy");
      } catch {
        return false;
      } finally {
        selection.removeAllRanges();
      }
    }
    confirm(value) {
      if (this.destroyed) return;
      this.button.textContent = this.params.copiedLabel;
      this.status.textContent = this.params.copiedLabel;
      if (this.confirmTimer) clearTimeout(this.confirmTimer);
      this.confirmTimer = setTimeout(() => {
        this.confirmTimer = null;
        this.button.textContent = this.params.copyLabel;
        this.status.textContent = "";
      }, CONFIRM_MS);
      if (this.events.OnCopied) this.events.OnCopied(value);
    }
  };

  // factory-entry.js
  var w = window;
  var ns = w["AIOutsystemsFED"] = w["AIOutsystemsFED"] || {};
  ns.CopyField = CopyField;
  if (!ns.__release) ns.__release = "dev";
})();
