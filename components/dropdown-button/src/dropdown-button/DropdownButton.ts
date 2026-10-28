import type { DropdownButtonConfig, DropdownButtonEvents, DropdownButtonParameters, DropdownButtonSize, DropdownButtonVariant } from './types';

const VARIANTS: DropdownButtonVariant[] = ['Primary', 'Secondary', 'Tertiary', 'Transparent'];
const SIZES: DropdownButtonSize[] = ['Medium', 'Small', 'ExtraSmall'];
const OPEN_MENU = 'dropdown-button__menu--is-open';
// What can take focus among the links the screen put in the Menu placeholder.
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
const SVG = 'http://www.w3.org/2000/svg';

const kebab = (name: string): string => name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

/**
 * A split button. The action part runs the default action: a button that
 * raises OnClick, or a link when Url is set. The chevron part shows and hides
 * the Block's Menu container, whose content (Links) OutSystems renders and
 * owns; this class never adds, moves or removes anything in it.
 *
 * Both parts are OutSystems UI buttons (btn, btn-primary, btn-small), so the
 * app's theme styles them. The menu follows the disclosure pattern: the chevron
 * has aria-expanded and aria-controls; ArrowDown opens it and moves into it,
 * ArrowUp/ArrowDown/Home/End move between its items, Escape closes it and
 * returns focus to the chevron, and a choice, a click outside or focus
 * leaving the component closes it.
 */
export class DropdownButton {
	private readonly mount: HTMLElement;
	private readonly menu: HTMLElement | null;
	private readonly events: DropdownButtonEvents;
	private readonly group: HTMLElement;
	private readonly divider: HTMLElement;
	private readonly trigger: HTMLButtonElement;
	private action: HTMLButtonElement | HTMLAnchorElement;
	private params: DropdownButtonParameters = { label: '', variant: 'Primary', size: 'Medium', enabled: true, url: '', icon: '', menuLabel: 'More options' };
	private open = false;
	private destroyed = false;

	constructor(config: DropdownButtonConfig) {
		const mount = document.getElementById(config.runtimeId);
		if (!mount) throw new Error(`DropdownButton: mount element "${config.runtimeId}" not found`);
		this.mount = mount;
		this.menu = config.menuId ? document.getElementById(config.menuId) : null;
		this.events = config.events || {};

		this.group = document.createElement('div');
		this.action = this.createAction('');
		this.divider = document.createElement('span');
		this.divider.className = 'dropdown-button__divider';
		this.divider.setAttribute('aria-hidden', 'true');
		this.trigger = document.createElement('button');
		this.trigger.type = 'button';
		this.trigger.setAttribute('aria-expanded', 'false');
		if (this.menu) this.trigger.setAttribute('aria-controls', this.menu.id);
		this.trigger.appendChild(this.chevron());
		this.trigger.addEventListener('click', this.handleTriggerClick);
		this.trigger.addEventListener('keydown', this.handleTriggerKeydown);
		this.group.append(this.action, this.divider, this.trigger);

		// The mount also holds the Menu container, which OutSystems renders: add the
		// buttons in front of it and leave it in place.
		this.mount.insertBefore(this.group, this.mount.firstChild);
		this.mount.addEventListener('focusout', this.handleFocusOut);
		if (this.menu) {
			this.menu.addEventListener('click', this.handleMenuClick);
			this.menu.addEventListener('keydown', this.handleMenuKeydown);
		}
		this.onParametersChanged(config);
	}

	/** Called from the Block's OnParametersChanged handler. */
	onParametersChanged(params: Partial<DropdownButtonParameters>): void {
		if (this.destroyed) return;
		const p = this.params;
		if (params.label !== undefined) p.label = params.label || '';
		if (params.variant !== undefined) p.variant = VARIANTS.indexOf(params.variant as DropdownButtonVariant) !== -1 ? params.variant : 'Primary';
		if (params.size !== undefined) p.size = SIZES.indexOf(params.size as DropdownButtonSize) !== -1 ? params.size : 'Medium';
		if (params.enabled !== undefined) p.enabled = params.enabled !== false;
		if (params.url !== undefined) p.url = safeUrl(params.url);
		if (params.icon !== undefined) p.icon = /^[a-z0-9-]+$/.test(params.icon || '') ? params.icon : '';
		if (params.menuLabel !== undefined) p.menuLabel = params.menuLabel || 'More options';

		// A link and a button are different elements: swap when Url is set or cleared.
		if ((p.url !== '') !== (this.action.tagName === 'A')) {
			const next = this.createAction(p.url);
			this.action.replaceWith(next);
			this.action = next;
		}
		if (!p.enabled) this.close(false);
		this.render();
	}

	/** Called from the Block's OnDestroy handler. */
	destroy(): void {
		if (this.destroyed) return;
		this.close(false);
		this.destroyed = true;
		this.action.removeEventListener('click', this.handleActionClick);
		this.trigger.removeEventListener('click', this.handleTriggerClick);
		this.trigger.removeEventListener('keydown', this.handleTriggerKeydown);
		this.mount.removeEventListener('focusout', this.handleFocusOut);
		if (this.menu) {
			this.menu.removeEventListener('click', this.handleMenuClick);
			this.menu.removeEventListener('keydown', this.handleMenuKeydown);
		}
		this.group.remove();
	}

	/** True while the menu is shown. */
	get isOpen(): boolean {
		return this.open;
	}

	private createAction(url: string): HTMLButtonElement | HTMLAnchorElement {
		let el: HTMLButtonElement | HTMLAnchorElement;
		if (url) {
			el = document.createElement('a');
		} else {
			el = document.createElement('button');
			el.type = 'button';
		}
		el.addEventListener('click', this.handleActionClick);
		return el;
	}

	private chevron(): SVGSVGElement {
		const svg = document.createElementNS(SVG, 'svg');
		svg.setAttribute('class', 'dropdown-button__chevron');
		svg.setAttribute('viewBox', '0 0 16 16');
		svg.setAttribute('aria-hidden', 'true');
		svg.setAttribute('focusable', 'false');
		const path = document.createElementNS(SVG, 'path');
		path.setAttribute('d', 'M4 6l4 4 4-4');
		svg.appendChild(path);
		return svg;
	}

	private render(): void {
		const p = this.params;
		const buttonClasses = ['btn', ...(p.variant === 'Primary' ? ['btn-primary'] : []), ...(p.size !== 'Medium' ? ['btn-small'] : [])].join(' ');
		this.group.className = [
			'dropdown-button__group',
			`dropdown-button__group--${kebab(p.variant)}`,
			`dropdown-button__group--${kebab(p.size)}`,
			...(p.enabled ? [] : ['dropdown-button__group--is-disabled']),
		].join(' ');

		this.action.className = `${buttonClasses} dropdown-button__action`;
		const content: Node[] = [];
		if (p.icon) {
			const icon = document.createElement('span');
			icon.className = `icon fa fa-${p.icon} dropdown-button__icon`;
			icon.setAttribute('aria-hidden', 'true');
			content.push(icon);
		}
		const label = document.createElement('span');
		label.className = 'dropdown-button__label';
		label.textContent = p.label;
		content.push(label);
		this.action.replaceChildren(...content);

		if (this.action instanceof HTMLAnchorElement) {
			// OutSystems UI styles .btn[disabled]; a link has no disabled state, so it
			// also loses its href and leaves the tab order.
			if (p.enabled) {
				this.action.href = p.url;
				this.action.removeAttribute('aria-disabled');
				this.action.removeAttribute('disabled');
				this.action.removeAttribute('tabindex');
			} else {
				this.action.removeAttribute('href');
				this.action.setAttribute('aria-disabled', 'true');
				this.action.setAttribute('disabled', '');
				this.action.setAttribute('tabindex', '-1');
			}
		} else {
			this.action.disabled = !p.enabled;
		}

		this.trigger.className = `${buttonClasses} dropdown-button__trigger${this.open ? ' dropdown-button__trigger--is-open' : ''}`;
		this.trigger.disabled = !p.enabled;
		this.trigger.setAttribute('aria-label', p.menuLabel);
		this.trigger.setAttribute('aria-expanded', String(this.open));
	}

	private show(): void {
		if (this.open || !this.params.enabled) return;
		this.open = true;
		if (this.menu) this.menu.classList.add(OPEN_MENU);
		document.addEventListener('click', this.handleDocumentClick, true);
		document.addEventListener('keydown', this.handleDocumentKeydown);
		this.render();
	}

	private close(returnFocus: boolean): void {
		if (!this.open || this.destroyed) return;
		this.open = false;
		if (this.menu) this.menu.classList.remove(OPEN_MENU);
		document.removeEventListener('click', this.handleDocumentClick, true);
		document.removeEventListener('keydown', this.handleDocumentKeydown);
		this.render();
		if (returnFocus) this.trigger.focus();
	}

	private items(): HTMLElement[] {
		return this.menu ? Array.prototype.slice.call(this.menu.querySelectorAll(FOCUSABLE)) : [];
	}

	private focusItem(index: number): void {
		const items = this.items();
		if (!items.length) return;
		items[(index + items.length) % items.length].focus();
	}

	private handleActionClick = (event: Event): void => {
		if (this.destroyed || !this.params.enabled) {
			event.preventDefault();
			return;
		}
		this.close(false);
		if (!this.params.url && this.events.OnClick) this.events.OnClick();
	};

	private handleTriggerClick = (): void => {
		if (this.destroyed || !this.params.enabled) return;
		if (this.open) this.close(false);
		else this.show();
	};

	private handleTriggerKeydown = (event: KeyboardEvent): void => {
		if (event.key !== 'ArrowDown' || !this.params.enabled) return;
		event.preventDefault();
		this.show();
		this.focusItem(0);
	};

	private handleMenuKeydown = (event: KeyboardEvent): void => {
		if (!this.open) return;
		const items = this.items();
		const at = items.indexOf(document.activeElement as HTMLElement);
		const moves: Record<string, number> = { ArrowDown: at + 1, ArrowUp: at - 1, Home: 0, End: items.length - 1 };
		if (!(event.key in moves)) return;
		event.preventDefault();
		this.focusItem(moves[event.key]);
	};

	// A choice in the menu closes it; the Link's own On Click still runs.
	private handleMenuClick = (event: Event): void => {
		const target = event.target as Element | null;
		if (this.open && target && target.closest && target.closest('a, button')) this.close(false);
	};

	private handleDocumentClick = (event: Event): void => {
		if (!this.mount.contains(event.target as Node)) this.close(false);
	};

	private handleDocumentKeydown = (event: KeyboardEvent): void => {
		if (event.key === 'Escape') this.close(true);
	};

	private handleFocusOut = (event: FocusEvent): void => {
		const next = event.relatedTarget as Node | null;
		if (next && !this.mount.contains(next)) this.close(false);
	};
}

// A link's address comes from the screen; javascript: and data: addresses are dropped.
function safeUrl(url: string | undefined): string {
	const value = (url || '').trim();
	return /^(javascript|data|vbscript):/i.test(value) ? '' : value;
}
