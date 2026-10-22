import type { RelativeTimeConfig, RelativeTimeParameters } from './types';

const REFRESH_MS = 30000;
// The largest unit that fits, so 90 seconds reads "2 minutes ago", not "90 seconds ago".
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
	['year', 365 * 24 * 3600],
	['month', 30 * 24 * 3600],
	['week', 7 * 24 * 3600],
	['day', 24 * 3600],
	['hour', 3600],
	['minute', 60],
	['second', 1],
];

/**
 * A <time> element that reads "3 minutes ago" or "in 2 days" in the given
 * locale (Intl.RelativeTimeFormat: no strings to translate), with the exact
 * date and time as its title and machine-readable datetime attribute.
 */
export class RelativeTime {
	private readonly mount: HTMLElement;
	private readonly time: HTMLTimeElement;
	private readonly now: () => number;
	private params: RelativeTimeParameters = { timestamp: '', locale: '', emptyLabel: '', live: true };
	private timer: ReturnType<typeof setInterval> | null = null;
	private destroyed = false;

	constructor(config: RelativeTimeConfig) {
		const mount = document.getElementById(config.runtimeId);
		if (!mount) throw new Error(`RelativeTime: mount element "${config.runtimeId}" not found`);
		this.mount = mount;
		this.now = config.now || Date.now;
		this.time = document.createElement('time');
		this.time.className = 'relative-time__value';
		this.mount.replaceChildren(this.time);
		this.onParametersChanged(config);
	}

	/** Called from the Block's OnParametersChanged handler. */
	onParametersChanged(params: Partial<RelativeTimeParameters>): void {
		if (this.destroyed) return;
		if (params.timestamp !== undefined) this.params.timestamp = params.timestamp || '';
		if (params.locale !== undefined) this.params.locale = params.locale || '';
		if (params.emptyLabel !== undefined) this.params.emptyLabel = params.emptyLabel || '';
		if (params.live !== undefined) this.params.live = params.live !== false;
		this.render();
		this.schedule();
	}

	/** Called from the Block's OnDestroy handler. */
	destroy(): void {
		if (this.destroyed) return;
		this.destroyed = true;
		this.stop();
		this.time.remove();
	}

	/** Re-renders now; the refresh timer calls this every 30 seconds. */
	refresh(): void {
		if (!this.destroyed) this.render();
	}

	private render(): void {
		const ms = Date.parse(this.params.timestamp);
		if (!this.params.timestamp || Number.isNaN(ms)) {
			this.time.textContent = this.params.emptyLabel;
			this.time.removeAttribute('datetime');
			this.time.removeAttribute('title');
			return;
		}
		const locale = this.params.locale || undefined;
		this.time.dateTime = new Date(ms).toISOString();
		this.time.title = safeFormat(() => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(ms), new Date(ms).toISOString());
		const seconds = Math.round((ms - this.now()) / 1000);
		const [unit, size] = UNITS.find(([, s]) => Math.abs(seconds) >= s) || ['second', 1];
		this.time.textContent = safeFormat(() => new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(Math.round(seconds / size), unit), this.time.title);
	}

	private schedule(): void {
		this.stop();
		if (this.params.live) this.timer = setInterval(() => this.refresh(), REFRESH_MS);
	}

	private stop(): void {
		if (this.timer) clearInterval(this.timer);
		this.timer = null;
	}
}

// An invalid locale tag throws a RangeError; show the fallback instead of nothing.
function safeFormat(format: () => string, fallback: string): string {
	try {
		return format();
	} catch {
		return fallback;
	}
}
