// CopyField's own checks: what it does, not the rules every component follows
// (those are in packages/toolchain/structural-checks.js and run first).
// Runs under jsdom (npm test) and in the preview page (preview/index.html?test=1).
var componentTest = {
	block: 'copy-field',
	osuiClasses: ['btn', 'btn-small', 'wcag-hide-text'],
	config: { value: 'ORD-42', label: 'Order', copyLabel: 'Copy', copiedLabel: 'Copied' },
	behaviour: function (t) {
		// A Clipboard API that answers synchronously, so the checks don't wait.
		var written = [];
		var fakeClipboard = {
			writeText: function (text) {
				written.push(text);
				return {
					then: function (ok) {
						ok();
					},
				};
			},
		};
		var realClipboard = Object.getOwnPropertyDescriptor(t.win.navigator, 'clipboard');
		Object.defineProperty(t.win.navigator, 'clipboard', { value: fakeClipboard, configurable: true });

		var host = t.mount('cf-test-mount');
		var copied = [];
		var field = new t.Ctor({
			runtimeId: 'cf-test-mount',
			value: 'ORD-42',
			label: 'Order',
			copyLabel: 'Copy',
			copiedLabel: 'Copied',
			events: {
				OnCopied: function (v) {
					copied.push(v);
				},
			},
		});
		var value = host.querySelector('.copy-field__value');
		var label = host.querySelector('.copy-field__label');
		var button = host.querySelector('button');
		var status = host.querySelector('.copy-field__status');

		t.check('shows the value', value && value.textContent === 'ORD-42');
		t.check('shows the label', label && label.textContent === 'Order' && !label.hidden);
		t.check('uses the OutSystems UI small button', button && button.classList.contains('btn') && button.classList.contains('btn-small'));
		t.check('the button says what it copies', button.textContent === 'Copy' && button.getAttribute('aria-label') === 'Copy: Order');
		t.check('the status is a polite live region, visually hidden', status && status.getAttribute('aria-live') === 'polite' && status.classList.contains('wcag-hide-text'));

		button.click();
		t.check('click copies the value', written.length === 1 && written[0] === 'ORD-42');
		t.check('click fires OnCopied with the value', copied.length === 1 && copied[0] === 'ORD-42');
		t.check('the button and the live region confirm the copy', button.textContent === 'Copied' && status.textContent === 'Copied');

		field.onParametersChanged({ value: 'ORD-43' });
		t.check('onParametersChanged updates the value', value.textContent === 'ORD-43');
		button.click();
		t.check('copies the new value', written[1] === 'ORD-43' && copied[1] === 'ORD-43');

		field.onParametersChanged({ label: '' });
		t.check('an empty label hides the label', label.hidden && button.getAttribute('aria-label') === 'Copy');
		field.onParametersChanged({ value: '' });
		t.check('an empty value disables the button', button.disabled === true);

		field.onParametersChanged({ value: '<img src=x onerror=alert(1)>' });
		t.check('markup in data renders as text, not HTML', host.querySelector('img') === null && value.textContent.indexOf('<img') !== -1);

		field.destroy();
		button.click();
		t.check('destroy removes the click listener', written.length === 2);
		host.remove();
		if (realClipboard) Object.defineProperty(t.win.navigator, 'clipboard', realClipboard);
		else delete t.win.navigator.clipboard;
	},
};

if (typeof module !== 'undefined') module.exports = componentTest;
