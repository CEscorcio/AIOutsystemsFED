"use strict";
(() => {
  // src/sparkline/Sparkline.ts
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
  ns.Sparkline = Sparkline;
  if (!ns.__release) ns.__release = "dev";
})();
