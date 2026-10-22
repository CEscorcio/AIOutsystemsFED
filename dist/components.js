/*!
 * Version: 2026.43.2
 * AIOutsystemsFED components
 * Built: 2026-10-22T15:11:18.397Z
 * Contains:
 *   components/confirm-button/src/index.ts
 *   components/copy-field/src/index.ts
 *   components/greeting-card/src/index.ts
 *   components/read-more/src/index.ts
 *   components/relative-time/src/index.ts
 *   components/sparkline/src/index.ts
 */
"use strict";

(() => {
  // components/confirm-button/src/confirm-button/ConfirmButton.ts
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

  // components/copy-field/src/copy-field/CopyField.ts
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

  // components/greeting-card/src/greeting-card/GreetingCard.ts
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

  // components/read-more/src/read-more/ReadMore.ts
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

  // components/relative-time/src/relative-time/RelativeTime.ts
  var REFRESH_MS = 3e4;
  var UNITS = [
    ["year", 365 * 24 * 3600],
    ["month", 30 * 24 * 3600],
    ["week", 7 * 24 * 3600],
    ["day", 24 * 3600],
    ["hour", 3600],
    ["minute", 60],
    ["second", 1]
  ];
  var RelativeTime = class {
    constructor(config) {
      this.params = { timestamp: "", locale: "", emptyLabel: "", live: true };
      this.timer = null;
      this.destroyed = false;
      const mount = document.getElementById(config.runtimeId);
      if (!mount) throw new Error(`RelativeTime: mount element "${config.runtimeId}" not found`);
      this.mount = mount;
      this.now = config.now || Date.now;
      this.time = document.createElement("time");
      this.time.className = "relative-time__value";
      this.mount.replaceChildren(this.time);
      this.onParametersChanged(config);
    }
    /** Called from the Block's OnParametersChanged handler. */
    onParametersChanged(params) {
      if (this.destroyed) return;
      if (params.timestamp !== void 0) this.params.timestamp = params.timestamp || "";
      if (params.locale !== void 0) this.params.locale = params.locale || "";
      if (params.emptyLabel !== void 0) this.params.emptyLabel = params.emptyLabel || "";
      if (params.live !== void 0) this.params.live = params.live !== false;
      this.render();
      this.schedule();
    }
    /** Called from the Block's OnDestroy handler. */
    destroy() {
      if (this.destroyed) return;
      this.destroyed = true;
      this.stop();
      this.time.remove();
    }
    /** Re-renders now; the refresh timer calls this every 30 seconds. */
    refresh() {
      if (!this.destroyed) this.render();
    }
    render() {
      const ms = Date.parse(this.params.timestamp);
      if (!this.params.timestamp || Number.isNaN(ms)) {
        this.time.textContent = this.params.emptyLabel;
        this.time.removeAttribute("datetime");
        this.time.removeAttribute("title");
        return;
      }
      const locale = this.params.locale || void 0;
      this.time.dateTime = new Date(ms).toISOString();
      this.time.title = safeFormat(() => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(ms), new Date(ms).toISOString());
      const seconds = Math.round((ms - this.now()) / 1e3);
      const [unit, size] = UNITS.find(([, s]) => Math.abs(seconds) >= s) || ["second", 1];
      this.time.textContent = safeFormat(() => new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(Math.round(seconds / size), unit), this.time.title);
    }
    schedule() {
      this.stop();
      if (this.params.live) this.timer = setInterval(() => this.refresh(), REFRESH_MS);
    }
    stop() {
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
    }
  };
  function safeFormat(format, fallback) {
    try {
      return format();
    } catch {
      return fallback;
    }
  }

  // components/sparkline/src/sparkline/Sparkline.ts
  var SVG = "http://www.w3.org/2000/svg";
  var WIDTH = 100;
  var HEIGHT = 24;
  var PAD = 2;
  function parseValues(text) {
    return String(text || "").split(/[\s,;]+/).filter((part) => part !== "").map(Number).filter((n) => Number.isFinite(n));
  }
  var Sparkline = class {
    constructor(config) {
      this.params = { values: "", label: "", showLast: true };
      this.destroyed = false;
      const mount = document.getElementById(config.runtimeId);
      if (!mount) throw new Error(`Sparkline: mount element "${config.runtimeId}" not found`);
      this.mount = mount;
      this.svg = document.createElementNS(SVG, "svg");
      this.svg.setAttribute("class", "sparkline__chart");
      this.svg.setAttribute("viewBox", `0 0 ${WIDTH} ${HEIGHT}`);
      this.svg.setAttribute("preserveAspectRatio", "none");
      this.svg.setAttribute("role", "img");
      this.svg.setAttribute("focusable", "false");
      this.line = document.createElementNS(SVG, "path");
      this.line.setAttribute("class", "sparkline__line");
      this.line.setAttribute("vector-effect", "non-scaling-stroke");
      this.dot = document.createElementNS(SVG, "circle");
      this.dot.setAttribute("class", "sparkline__dot");
      this.dot.setAttribute("r", "1.8");
      this.svg.append(this.line, this.dot);
      this.mount.replaceChildren(this.svg);
      this.onParametersChanged(config);
    }
    /** Called from the Block's OnParametersChanged handler. */
    onParametersChanged(params) {
      if (this.destroyed) return;
      if (params.values !== void 0) this.params.values = params.values || "";
      if (params.label !== void 0) this.params.label = params.label || "";
      if (params.showLast !== void 0) this.params.showLast = params.showLast !== false;
      this.render();
    }
    /** Called from the Block's OnDestroy handler. */
    destroy() {
      if (this.destroyed) return;
      this.destroyed = true;
      this.svg.remove();
    }
    render() {
      const values = parseValues(this.params.values);
      const drawable = values.length >= 2;
      this.svg.style.display = drawable ? "" : "none";
      if (!drawable) {
        this.line.setAttribute("d", "");
        this.svg.setAttribute("aria-label", this.params.label);
        return;
      }
      const min = Math.min(...values);
      const max = Math.max(...values);
      const span = max - min || 1;
      const x = (i) => PAD + i * (WIDTH - 2 * PAD) / (values.length - 1);
      const y = (v) => max === min ? HEIGHT / 2 : HEIGHT - PAD - (v - min) * (HEIGHT - 2 * PAD) / span;
      const round = (n) => Math.round(n * 100) / 100;
      this.line.setAttribute("d", values.map((v, i) => `${i === 0 ? "M" : "L"}${round(x(i))} ${round(y(v))}`).join(" "));
      const last = values.length - 1;
      this.dot.setAttribute("cx", String(round(x(last))));
      this.dot.setAttribute("cy", String(round(y(values[last]))));
      this.dot.style.display = this.params.showLast ? "" : "none";
      const summary = `${values[0]} to ${values[last]}`;
      this.svg.setAttribute("aria-label", this.params.label ? `${this.params.label}: ${summary}` : summary);
    }
  };

  // factory-entry.js
  var w = window;
  var ns = w["AIOutsystemsFED"] = w["AIOutsystemsFED"] || {};
  ns.ConfirmButton = ConfirmButton;
  ns.CopyField = CopyField;
  ns.GreetingCard = GreetingCard;
  ns.ReadMore = ReadMore;
  ns.RelativeTime = RelativeTime;
  ns.Sparkline = Sparkline;
  ns.__release = "2026.43.2";
})();
