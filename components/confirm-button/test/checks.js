// ConfirmButton's own checks: what it does, not the rules every component follows
// (those are in packages/toolchain/structural-checks.js and run first).
// Runs under jsdom (npm test) and in the preview page (preview/index.html?test=1).
var componentTest = {
	block: 'confirm-button',
	osuiClasses: ['btn', 'btn-error', 'wcag-hide-text'],
	config: { label: 'Delete', confirmLabel: 'Sure?', timeoutSeconds: 4, isDisabled: false },
	behaviour: function (t) {
		var host = t.mount('cb-test-mount');
		var confirmed = 0;
		var cb = new t.Ctor({
			runtimeId: 'cb-test-mount',
			label: 'Delete',
			confirmLabel: 'Sure?',
			timeoutSeconds: 4,
			isDisabled: false,
			events: {
				OnConfirmed: function () {
					confirmed++;
				},
			},
		});
		var button = host.querySelector('button');
		var status = host.querySelector('.confirm-button__status');
		function key(name) {
			button.dispatchEvent(new t.win.KeyboardEvent('keydown', { key: name, bubbles: true }));
		}

		t.check('starts unarmed, showing Label on an OutSystems UI button', button.textContent === 'Delete' && button.classList.contains('btn') && !button.classList.contains('btn-error'));
		t.check('aria-pressed says it is not armed', button.getAttribute('aria-pressed') === 'false');

		button.click();
		t.check(
			'the first click arms it: ConfirmLabel, error button, armed state',
			cb.isArmed && button.textContent === 'Sure?' && button.classList.contains('btn-error') && button.classList.contains('confirm-button__button--is-armed'),
		);
		t.check('arming is announced to screen readers', status.getAttribute('aria-live') === 'polite' && status.textContent === 'Sure?');
		t.check('the first click does not confirm', confirmed === 0);

		button.click();
		t.check('the second click raises OnConfirmed once and disarms', confirmed === 1 && !cb.isArmed && button.textContent === 'Delete' && status.textContent === '');

		button.click();
		key('Escape');
		t.check('Escape disarms without confirming', !cb.isArmed && confirmed === 1);

		button.click();
		button.dispatchEvent(new t.win.FocusEvent('blur'));
		t.check('leaving the button disarms it', !cb.isArmed && button.textContent === 'Delete');

		button.click();
		cb.onParametersChanged({ isDisabled: true });
		t.check('IsDisabled disables and disarms it', button.disabled && !cb.isArmed);
		button.click();
		t.check('a disabled button ignores clicks', !cb.isArmed && confirmed === 1);

		cb.onParametersChanged({ isDisabled: false, label: 'Remove', confirmLabel: '' });
		button.click();
		t.check('an empty ConfirmLabel falls back', button.textContent === 'Click again to confirm');
		key('Escape');
		t.check('onParametersChanged updates the label', button.textContent === 'Remove');

		cb.onParametersChanged({ label: '<img src=x onerror=alert(1)>' });
		t.check('markup in data renders as text, not HTML', host.querySelector('img') === null && button.textContent.indexOf('<img') !== -1);

		cb.destroy();
		button.click();
		t.check('destroy removes the click listener', confirmed === 1 && !cb.isArmed);
		host.remove();
	},
};

if (typeof module !== 'undefined') module.exports = componentTest;
