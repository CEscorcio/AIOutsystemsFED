import type { ReadMoreConfig, ReadMoreEvents, ReadMoreParameters } from './types';

const DEFAULT_LINES = 3;
let nextId = 0;

/**
 * Long text clamped to N lines with a toggle. The clamp is CSS line-clamp; the
 * number of lines is set on the element, as -webkit-line-clamp, because it's
 * data (an Input Parameter), not a look. The toggle is a real button with
 * aria-expanded and aria-controls. It's shown unless the browser can measure
 * that the text fits in N lines, so it never hides text it can't measure.
 */
export class ReadMore {
	private readonly mount: HTMLElement;
	private readonly events: ReadMoreEvents;
	private readonly text: HTMLElement;
	private readonly toggle: HTMLButtonElement;
	private params: ReadMoreParameters = { text: '', lines: DEFAULT_LINES, moreLabel: 'Show more', lessLabel: 'Show less' };
	private expanded = false;
	private destroyed = false;

	constructor(config: ReadMoreConfig) {
		const mount = document.getElementById(config.runtimeId);
		if (!mount) throw new Error(`ReadMore: mount element "${config.runtimeId}" not found`);
		this.mount = mount;
		this.events = config.events || {};
		this.text = document.createElement('p');
		this.text.className = 'read-more__text';
		this.text.id = `read-more-${config.runtimeId}-${(nextId += 1)}`;
		this.toggle = document.createElement('button');
		this.toggle.type = 'button';
		this.toggle.className = 'read-more__toggle';
		this.toggle.setAttribute('aria-controls', this.text.id);
		this.toggle.addEventListener('click', this.handleToggle);
		this.mount.replaceChildren(this.text, this.toggle);
		this.onParametersChanged(config);
	}

	/** Called from the Block's OnParametersChanged handler. */
	onParametersChanged(params: Partial<ReadMoreParameters>): void {
		if (this.destroyed) return;
		if (params.text !== undefined) this.params.text = params.text || '';
		if (params.lines !== undefined) this.params.lines = params.lines > 0 ? Math.floor(params.lines) : DEFAULT_LINES;
		if (params.moreLabel !== undefined) this.params.moreLabel = params.moreLabel || 'Show more';
		if (params.lessLabel !== undefined) this.params.lessLabel = params.lessLabel || 'Show less';
		this.text.textContent = this.params.text;
		this.render();
	}

	/** Called from the Block's OnDestroy handler. */
	destroy(): void {
		if (this.destroyed) return;
		this.destroyed = true;
		this.toggle.removeEventListener('click', this.handleToggle);
		this.text.remove();
		this.toggle.remove();
	}

	/** True while the text is shown in full. */
	get isExpanded(): boolean {
		return this.expanded;
	}

	private handleToggle = (): void => {
		if (this.destroyed) return;
		this.expanded = !this.expanded;
		this.render();
		if (this.events.OnToggled) this.events.OnToggled(this.expanded);
	};

	private render(): void {
		this.text.classList.toggle('read-more__text--is-clamped', !this.expanded);
		this.text.style.setProperty('-webkit-line-clamp', this.expanded ? '' : String(this.params.lines));
		this.toggle.textContent = this.expanded ? this.params.lessLabel : this.params.moreLabel;
		this.toggle.setAttribute('aria-expanded', String(this.expanded));
		// Hide the toggle only when the browser measured that the collapsed text fits.
		const measured = this.text.clientHeight > 0;
		const fits = !this.expanded && measured && this.text.scrollHeight <= this.text.clientHeight + 1;
		this.toggle.hidden = !this.params.text || fits;
	}
}
