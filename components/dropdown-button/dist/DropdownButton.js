"use strict";
(() => {
  // src/dropdown-button/DropdownButton.ts
  var VARIANTS = ["Primary", "Secondary", "Tertiary", "Transparent"];
  var SIZES = ["Medium", "Small", "ExtraSmall"];
  var OPEN_MENU = "dropdown-button__menu--is-open";
  var FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
  var SVG = "http://www.w3.org/2000/svg";
  var kebab = (name) => name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  var instances = /* @__PURE__ */ new WeakMap();
  var DropdownButton = class {
    constructor(config) {
      this.params = { label: "", variant: "Primary", size: "Medium", enabled: true, url: "", icon: "", menuLabel: "More options" };
      this.open = false;
      this.destroyed = false;
      this.handleActionClick = (event) => {
        if (this.destroyed || !this.params.enabled) {
          event.preventDefault();
          return;
        }
        this.close(false);
        if (!this.params.url && this.events.OnClick) this.events.OnClick();
      };
      this.handleTriggerClick = () => {
        if (this.destroyed || !this.params.enabled) return;
        if (this.open) this.close(false);
        else this.show();
      };
      this.handleTriggerKeydown = (event) => {
        if (event.key !== "ArrowDown" || !this.params.enabled) return;
        event.preventDefault();
        this.show();
        this.focusItem(0);
      };
      this.handleMenuKeydown = (event) => {
        if (!this.open) return;
        const items = this.items();
        const at = items.indexOf(document.activeElement);
        const moves = { ArrowDown: at + 1, ArrowUp: at - 1, Home: 0, End: items.length - 1 };
        if (!(event.key in moves)) return;
        event.preventDefault();
        this.focusItem(moves[event.key]);
      };
      // A choice in the menu closes it; the Link's own On Click still runs.
      this.handleMenuClick = (event) => {
        const target = event.target;
        if (this.open && target && target.closest && target.closest("a, button")) this.close(false);
      };
      this.handleDocumentClick = (event) => {
        if (!this.mount.contains(event.target)) this.close(false);
      };
      this.handleDocumentKeydown = (event) => {
        if (event.key === "Escape") this.close(true);
      };
      this.handleFocusOut = (event) => {
        const next = event.relatedTarget;
        if (next && !this.mount.contains(next)) this.close(false);
      };
      const mount = document.getElementById(config.runtimeId);
      if (!mount) throw new Error(`DropdownButton: mount element "${config.runtimeId}" not found`);
      const previous = instances.get(mount);
      if (previous) previous.destroy();
      instances.set(mount, this);
      this.mount = mount;
      this.menu = config.menuId ? document.getElementById(config.menuId) : null;
      this.events = config.events || {};
      this.group = document.createElement("div");
      this.action = this.createAction("");
      this.divider = document.createElement("span");
      this.divider.className = "dropdown-button__divider";
      this.divider.setAttribute("aria-hidden", "true");
      this.trigger = document.createElement("button");
      this.trigger.type = "button";
      this.trigger.setAttribute("aria-expanded", "false");
      if (this.menu) this.trigger.setAttribute("aria-controls", this.menu.id);
      this.trigger.appendChild(this.chevron());
      this.trigger.addEventListener("click", this.handleTriggerClick);
      this.trigger.addEventListener("keydown", this.handleTriggerKeydown);
      this.group.append(this.action, this.divider, this.trigger);
      this.mount.insertBefore(this.group, this.mount.firstChild);
      this.mount.addEventListener("focusout", this.handleFocusOut);
      if (this.menu) {
        this.menu.addEventListener("click", this.handleMenuClick);
        this.menu.addEventListener("keydown", this.handleMenuKeydown);
      }
      this.onParametersChanged(config);
    }
    /** Called from the Block's OnParametersChanged handler. */
    onParametersChanged(params) {
      if (this.destroyed) return;
      const p = this.params;
      if (params.label !== void 0) p.label = params.label || "";
      if (params.variant !== void 0) p.variant = VARIANTS.indexOf(params.variant) !== -1 ? params.variant : "Primary";
      if (params.size !== void 0) p.size = SIZES.indexOf(params.size) !== -1 ? params.size : "Medium";
      if (params.enabled !== void 0) p.enabled = params.enabled !== false;
      if (params.url !== void 0) p.url = safeUrl(params.url);
      if (params.icon !== void 0) p.icon = /^[a-z0-9-]+$/.test(params.icon || "") ? params.icon : "";
      if (params.menuLabel !== void 0) p.menuLabel = params.menuLabel || "More options";
      if (p.url !== "" !== (this.action.tagName === "A")) {
        const next = this.createAction(p.url);
        this.action.replaceWith(next);
        this.action = next;
      }
      if (!p.enabled) this.close(false);
      this.render();
    }
    /** Called from the Block's OnDestroy handler. */
    destroy() {
      if (this.destroyed) return;
      this.close(false);
      this.destroyed = true;
      this.action.removeEventListener("click", this.handleActionClick);
      this.trigger.removeEventListener("click", this.handleTriggerClick);
      this.trigger.removeEventListener("keydown", this.handleTriggerKeydown);
      this.mount.removeEventListener("focusout", this.handleFocusOut);
      if (this.menu) {
        this.menu.removeEventListener("click", this.handleMenuClick);
        this.menu.removeEventListener("keydown", this.handleMenuKeydown);
      }
      this.group.remove();
      if (instances.get(this.mount) === this) instances.delete(this.mount);
    }
    /** True while the menu is shown. */
    get isOpen() {
      return this.open;
    }
    createAction(url) {
      let el;
      if (url) {
        el = document.createElement("a");
      } else {
        el = document.createElement("button");
        el.type = "button";
      }
      el.addEventListener("click", this.handleActionClick);
      return el;
    }
    chevron() {
      const svg = document.createElementNS(SVG, "svg");
      svg.setAttribute("class", "dropdown-button__chevron");
      svg.setAttribute("viewBox", "0 0 16 16");
      svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("focusable", "false");
      const path = document.createElementNS(SVG, "path");
      path.setAttribute("d", "M4 6l4 4 4-4");
      svg.appendChild(path);
      return svg;
    }
    render() {
      const p = this.params;
      const buttonClasses = ["btn", ...p.variant === "Primary" ? ["btn-primary"] : [], ...p.size !== "Medium" ? ["btn-small"] : []].join(" ");
      this.group.className = [
        "dropdown-button__group",
        `dropdown-button__group--${kebab(p.variant)}`,
        `dropdown-button__group--${kebab(p.size)}`,
        ...p.enabled ? [] : ["dropdown-button__group--is-disabled"]
      ].join(" ");
      this.action.className = `${buttonClasses} dropdown-button__action`;
      const content = [];
      if (p.icon) {
        const icon = document.createElement("span");
        icon.className = `icon fa fa-${p.icon} dropdown-button__icon`;
        icon.setAttribute("aria-hidden", "true");
        content.push(icon);
      }
      const label = document.createElement("span");
      label.className = "dropdown-button__label";
      label.textContent = p.label;
      content.push(label);
      this.action.replaceChildren(...content);
      if (this.action instanceof HTMLAnchorElement) {
        if (p.enabled) {
          this.action.href = p.url;
          this.action.removeAttribute("aria-disabled");
          this.action.removeAttribute("disabled");
          this.action.removeAttribute("tabindex");
        } else {
          this.action.removeAttribute("href");
          this.action.setAttribute("aria-disabled", "true");
          this.action.setAttribute("disabled", "");
          this.action.setAttribute("tabindex", "-1");
        }
      } else {
        this.action.disabled = !p.enabled;
      }
      this.trigger.className = `${buttonClasses} dropdown-button__trigger${this.open ? " dropdown-button__trigger--is-open" : ""}`;
      this.trigger.disabled = !p.enabled;
      this.trigger.setAttribute("aria-label", p.menuLabel);
      this.trigger.setAttribute("aria-expanded", String(this.open));
    }
    show() {
      if (this.open || !this.params.enabled) return;
      this.open = true;
      if (this.menu) this.menu.classList.add(OPEN_MENU);
      document.addEventListener("click", this.handleDocumentClick, true);
      document.addEventListener("keydown", this.handleDocumentKeydown);
      this.render();
    }
    close(returnFocus) {
      if (!this.open || this.destroyed) return;
      this.open = false;
      if (this.menu) this.menu.classList.remove(OPEN_MENU);
      document.removeEventListener("click", this.handleDocumentClick, true);
      document.removeEventListener("keydown", this.handleDocumentKeydown);
      this.render();
      if (returnFocus) this.trigger.focus();
    }
    items() {
      return this.menu ? Array.prototype.slice.call(this.menu.querySelectorAll(FOCUSABLE)) : [];
    }
    focusItem(index) {
      const items = this.items();
      if (!items.length) return;
      items[(index + items.length) % items.length].focus();
    }
  };
  function safeUrl(url) {
    const value = (url || "").trim();
    return /^(javascript|data|vbscript):/i.test(value) ? "" : value;
  }

  // factory-entry.js
  var w = window;
  var ns = w["AIOutsystemsFED"] = w["AIOutsystemsFED"] || {};
  ns.DropdownButton = DropdownButton;
  if (!ns.__release) ns.__release = "dev";
})();
