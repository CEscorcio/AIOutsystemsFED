import type { SparklineConfig, SparklineParameters } from './types';

const SVG = 'http://www.w3.org/2000/svg';
// The drawing's coordinate box. The SVG stretches to its container
// (preserveAspectRatio none), and the stroke keeps its width (non-scaling-stroke).
const WIDTH = 100;
const HEIGHT = 24;
const PAD = 2;

/** Parses "3,5; 2 8" into [3, 5, 2, 8], dropping anything that isn't a finite number. */
export function parseValues(text: string): number[] {
	return String(text || '')
		.split(/[\s,;]+/)
		.filter((part) => part !== '')
		.map(Number)
		.filter((n) => Number.isFinite(n));
}

/**
 * A small inline trend line drawn as SVG: one path, and an optional dot on the
 * last point. Colours come from the stylesheet (OutSystems UI variables), so
 * the app's theme recolours it. Screen readers get the label, with the first
 * and last values.
 */
export class Sparkline {
	private readonly mount: HTMLElement;
	private readonly svg: SVGSVGElement;
	private readonly line: SVGPathElement;
	private readonly dot: SVGCircleElement;
	private params: SparklineParameters = { values: '', label: '', showLast: true };
	private destroyed = false;

	constructor(config: SparklineConfig) {
		const mount = document.getElementById(config.runtimeId);
		if (!mount) throw new Error(`Sparkline: mount element "${config.runtimeId}" not found`);
		this.mount = mount;
		this.svg = document.createElementNS(SVG, 'svg');
		this.svg.setAttribute('class', 'sparkline__chart');
		this.svg.setAttribute('viewBox', `0 0 ${WIDTH} ${HEIGHT}`);
		this.svg.setAttribute('preserveAspectRatio', 'none');
		this.svg.setAttribute('role', 'img');
		this.svg.setAttribute('focusable', 'false');
		this.line = document.createElementNS(SVG, 'path');
		this.line.setAttribute('class', 'sparkline__line');
		this.line.setAttribute('vector-effect', 'non-scaling-stroke');
		this.dot = document.createElementNS(SVG, 'circle');
		this.dot.setAttribute('class', 'sparkline__dot');
		this.dot.setAttribute('r', '1.8');
		this.svg.append(this.line, this.dot);
		this.mount.replaceChildren(this.svg);
		this.onParametersChanged(config);
	}

	/** Called from the Block's OnParametersChanged handler. */
	onParametersChanged(params: Partial<SparklineParameters>): void {
		if (this.destroyed) return;
		if (params.values !== undefined) this.params.values = params.values || '';
		if (params.label !== undefined) this.params.label = params.label || '';
		if (params.showLast !== undefined) this.params.showLast = params.showLast !== false;
		this.render();
	}

	/** Called from the Block's OnDestroy handler. */
	destroy(): void {
		if (this.destroyed) return;
		this.destroyed = true;
		this.svg.remove();
	}

	private render(): void {
		const values = parseValues(this.params.values);
		const drawable = values.length >= 2;
		this.svg.style.display = drawable ? '' : 'none';
		if (!drawable) {
			this.line.setAttribute('d', '');
			this.svg.setAttribute('aria-label', this.params.label);
			return;
		}
		const min = Math.min(...values);
		const max = Math.max(...values);
		const span = max - min || 1; // a flat line sits in the middle
		const x = (i: number): number => PAD + (i * (WIDTH - 2 * PAD)) / (values.length - 1);
		const y = (v: number): number => (max === min ? HEIGHT / 2 : HEIGHT - PAD - ((v - min) * (HEIGHT - 2 * PAD)) / span);
		const round = (n: number): number => Math.round(n * 100) / 100;
		this.line.setAttribute('d', values.map((v, i) => `${i === 0 ? 'M' : 'L'}${round(x(i))} ${round(y(v))}`).join(' '));
		const last = values.length - 1;
		this.dot.setAttribute('cx', String(round(x(last))));
		this.dot.setAttribute('cy', String(round(y(values[last]))));
		this.dot.style.display = this.params.showLast ? '' : 'none';
		const summary = `${values[0]} to ${values[last]}`;
		this.svg.setAttribute('aria-label', this.params.label ? `${this.params.label}: ${summary}` : summary);
	}
}
