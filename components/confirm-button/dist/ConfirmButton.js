"use strict";
(() => {
  // src/confirm-button/ConfirmButton.ts
  var DEFAULT_TIMEOUT_S = 4;
  var ConfirmButton = class {
    constructor(config) {
      this.params = { label: "", confirmLabel: "Click again to confirm", timeoutSeconds: DEFAULT_TIMEOUT_S, isDisabled: false };
      this.armed = false;
      this.timer = null;
      this.destroyed = false;
      this.handleClick = () => {
        if (this.destroyed || this.params.isDisabled) return;
        if (!this.armed) {
          this.armed = true;
          this.status.textContent = this.params.confirmLabel;
          this.clearTimer();
          this.timer = setTimeout(this.disarm, this.params.timeoutSeconds * 1e3);
          this.render();
          return;
        }
        this.disarm();
        if (this.events.OnConfirmed) this.events.OnConfirmed();
      };
      this.handleKeydown = (event) => {
        if (event.key === "Escape" && this.armed) this.disarm();
      };
      this.disarm = () => {
        if (this.destroyed) return;
        this.armed = false;
        this.clearTimer();
        this.status.textContent = "";
        this.render();
      };
      const mount = document.getElementById(config.runtimeId);
      if (!mount) throw new Error(`ConfirmButton: mount element "${config.runtimeId}" not found`);
      this.mount = mount;
      this.events = config.events || {};
      this.button = document.createElement("button");
      this.button.type = "button";
      this.button.className = "btn confirm-button__button";
      this.button.addEventListener("click", this.handleClick);
      this.button.addEventListener("blur", this.disarm);
      this.button.addEventListener("keydown", this.handleKeydown);
      this.status = document.createElement("span");
      this.status.className = "wcag-hide-text confirm-button__status";
      this.status.setAttribute("aria-live", "polite");
      this.mount.replaceChildren(this.button, this.status);
      this.onParametersChanged(config);
    }
    /** Called from the Block's OnParametersChanged handler. */
    onParametersChanged(params) {
      if (this.destroyed) return;
      if (params.label !== void 0) this.params.label = params.label || "";
      if (params.confirmLabel !== void 0) this.params.confirmLabel = params.confirmLabel || "Click again to confirm";
      if (params.timeoutSeconds !== void 0) this.params.timeoutSeconds = params.timeoutSeconds > 0 ? params.timeoutSeconds : DEFAULT_TIMEOUT_S;
      if (params.isDisabled !== void 0) this.params.isDisabled = params.isDisabled === true;
      this.button.disabled = this.params.isDisabled;
      if (this.params.isDisabled) this.disarm();
      else this.render();
    }
    /** Called from the Block's OnDestroy handler. */
    destroy() {
      if (this.destroyed) return;
      this.destroyed = true;
      this.clearTimer();
      this.button.removeEventListener("click", this.handleClick);
      this.button.removeEventListener("blur", this.disarm);
      this.button.removeEventListener("keydown", this.handleKeydown);
      this.button.remove();
      this.status.remove();
    }
    /** True between the first click and the confirmation (or the disarm). */
    get isArmed() {
      return this.armed;
    }
    render() {
      this.button.textContent = this.armed ? this.params.confirmLabel : this.params.label;
      this.button.classList.toggle("btn-error", this.armed);
      this.button.classList.toggle("confirm-button__button--is-armed", this.armed);
      this.button.setAttribute("aria-pressed", String(this.armed));
    }
    clearTimer() {
      if (this.timer) clearTimeout(this.timer);
      this.timer = null;
    }
  };

  // factory-entry.js
  var w = window;
  var ns = w["AIOutsystemsFED"] = w["AIOutsystemsFED"] || {};
  ns.ConfirmButton = ConfirmButton;
  if (!ns.__release) ns.__release = "dev";
})();
