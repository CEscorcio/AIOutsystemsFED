import type { GreetingCardConfig, GreetingCardEvents, GreetingCardParameters } from './types';

// Styles live in style/greeting-card.scss and ship as their own stylesheet
// (dist/GreetingCard.css); this class only renders markup with the BEM classes.

// What each text falls back to when its input is empty. Every visible string
// comes from an input; these are only the defaults component.json documents.
const DEFAULTS: GreetingCardParameters = {
	name: '',
	buttonLabel: 'Greet',
	greeting: 'Hello, {name}!',
	fallbackName: 'there',
	countLabel: 'Greeted {count} times',
	countLabelOne: 'Greeted 1 time',
};

// Replaces {key} placeholders literally (no regular expressions built from data).
const fill = (template: string, values: Record<string, string>): string => Object.keys(values).reduce((text, key) => text.split(`{${key}}`).join(values[key]), template);

export class GreetingCard {
	private readonly mount: HTMLElement;
	private readonly events: GreetingCardEvents;
	private readonly root: HTMLElement;
	private readonly title: HTMLElement;
	private readonly countLabel: HTMLElement;
	private readonly button: HTMLButtonElement;
	private params: GreetingCardParameters = { ...DEFAULTS };
	private count = 0;
	private destroyed = false;

	constructor(config: GreetingCardConfig) {
		const mount = document.getElementById(config.runtimeId);
		if (!mount) {
			throw new Error(`GreetingCard: mount element "${config.runtimeId}" not found`);
		}
		this.mount = mount;
		this.events = config.events || {};

		this.root = document.createElement('div');
		this.root.className = 'card greeting-card__body';

		const text = document.createElement('div');
		text.className = 'greeting-card__text';
		this.title = document.createElement('p');
		this.title.className = 'greeting-card__title';
		this.countLabel = document.createElement('span');
		this.countLabel.className = 'greeting-card__count';
		text.append(this.title, this.countLabel);

		this.button = document.createElement('button');
		this.button.type = 'button';
		this.button.className = 'btn btn-primary greeting-card__button';
		this.button.addEventListener('click', this.handleClick);

		this.root.append(text, this.button);
		this.mount.replaceChildren(this.root);

		this.onParametersChanged(config);
	}

	/** Called from the Block's OnParametersChanged handler. Partial updates keep the rest, and the count. */
	onParametersChanged(params: Partial<GreetingCardParameters>): void {
		if (this.destroyed) return;
		for (const key of Object.keys(DEFAULTS) as (keyof GreetingCardParameters)[]) {
			if (params[key] !== undefined) this.params[key] = params[key] || DEFAULTS[key];
		}
		this.render();
	}

	/** Called from the Block's OnDestroy handler. */
	destroy(): void {
		if (this.destroyed) return;
		this.destroyed = true;
		this.button.removeEventListener('click', this.handleClick);
		this.root.remove();
	}

	private readonly handleClick = (): void => {
		this.count += 1;
		this.render();
		if (this.events.OnGreetClicked) this.events.OnGreetClicked(this.count);
	};

	// Platform data enters the DOM through textContent only, never innerHTML.
	private render(): void {
		const p = this.params;
		this.title.textContent = fill(p.greeting, { name: p.name || p.fallbackName });
		this.button.textContent = p.buttonLabel;
		this.countLabel.textContent = fill(this.count === 1 ? p.countLabelOne : p.countLabel, { count: String(this.count) });
	}
}
