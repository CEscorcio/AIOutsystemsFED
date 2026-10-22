import type { ConfirmButtonConfig, ConfirmButtonEvents, ConfirmButtonParameters } from './types';

const DEFAULT_TIMEOUT_S = 4;

/**
 * A two-step button: the first click arms it (OutSystems UI's error button,
 * text ConfirmLabel), the second click raises OnConfirmed. It disarms after
 * TimeoutSeconds, when focus leaves it, or on Escape. The armed text is
 * announced through a polite live region.
 */
export class ConfirmButton {
	private readonly mount: HTMLElement;
	private readonly events: ConfirmButtonEvents;
	private readonly button: HTMLButtonElement;
	private readonly status: HTMLElement;
	private params: ConfirmButtonParameters = { label: '', confirmLabel: 'Click again to confirm', timeoutSeconds: DEFAULT_TIMEOUT_S, isDisabled: false };
	private armed = false;
	private timer: ReturnType<typeof setTimeout> | null = null;
	private destroyed = false;

	constructor(config: ConfirmButtonConfig) {
		const mount = document.getElementById(config.runtimeId);
		if (!mount) throw new Error(`ConfirmButton: mount element "${config.runtimeId}" not found`);
		this.mount = mount;
		this.events = config.events || {};
		this.button = document.createElement('button');
		this.button.type = 'button';
		this.button.className = 'btn confirm-button__button';
		this.button.addEventListener('click', this.handleClick);
		this.button.addEventListener('blur', this.disarm);
		this.button.addEventListener('keydown', this.handleKeydown);
		this.status = document.createElement('span');
		this.status.className = 'wcag-hide-text confirm-button__status';
		this.status.setAttribute('aria-live', 'polite');
		this.mount.replaceChildren(this.button, this.status);
		this.onParametersChanged(config);
	}

	/** Called from the Block's OnParametersChanged handler. */
	onParametersChanged(params: Partial<ConfirmButtonParameters>): void {
		if (this.destroyed) return;
		if (params.label !== undefined) this.params.label = params.label || '';
		if (params.confirmLabel !== undefined) this.params.confirmLabel = params.confirmLabel || 'Click again to confirm';
		if (params.timeoutSeconds !== undefined) this.params.timeoutSeconds = params.timeoutSeconds > 0 ? params.timeoutSeconds : DEFAULT_TIMEOUT_S;
		if (params.isDisabled !== undefined) this.params.isDisabled = params.isDisabled === true;
		this.button.disabled = this.params.isDisabled;
		if (this.params.isDisabled) this.disarm();
		else this.render();
	}

	/** Called from the Block's OnDestroy handler. */
	destroy(): void {
		if (this.destroyed) return;
		this.destroyed = true;
		this.clearTimer();
		this.button.removeEventListener('click', this.handleClick);
		this.button.removeEventListener('blur', this.disarm);
		this.button.removeEventListener('keydown', this.handleKeydown);
		this.button.remove();
		this.status.remove();
	}

	/** True between the first click and the confirmation (or the disarm). */
	get isArmed(): boolean {
		return this.armed;
	}

	private handleClick = (): void => {
		if (this.destroyed || this.params.isDisabled) return;
		if (!this.armed) {
			this.armed = true;
			this.status.textContent = this.params.confirmLabel;
			this.clearTimer();
			this.timer = setTimeout(this.disarm, this.params.timeoutSeconds * 1000);
			this.render();
			return;
		}
		this.disarm();
		if (this.events.OnConfirmed) this.events.OnConfirmed();
	};

	private handleKeydown = (event: KeyboardEvent): void => {
		if (event.key === 'Escape' && this.armed) this.disarm();
	};

	private disarm = (): void => {
		if (this.destroyed) return;
		this.armed = false;
		this.clearTimer();
		this.status.textContent = '';
		this.render();
	};

	private render(): void {
		this.button.textContent = this.armed ? this.params.confirmLabel : this.params.label;
		this.button.classList.toggle('btn-error', this.armed);
		this.button.classList.toggle('confirm-button__button--is-armed', this.armed);
		this.button.setAttribute('aria-pressed', String(this.armed));
	}

	private clearTimer(): void {
		if (this.timer) clearTimeout(this.timer);
		this.timer = null;
	}
}
