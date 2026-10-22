"use strict";
(() => {
  // src/relative-time/RelativeTime.ts
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

  // factory-entry.js
  var w = window;
  var ns = w["AIOutsystemsFED"] = w["AIOutsystemsFED"] || {};
  ns.RelativeTime = RelativeTime;
  if (!ns.__release) ns.__release = "dev";
})();
