// RelativeTime's own checks: what it does, not the rules every component follows
// (those are in packages/toolchain/structural-checks.js and run first).
// Runs under jsdom (npm test) and in the preview page (preview/index.html?test=1).
var componentTest = {
	block: 'relative-time',
	osuiClasses: [],
	config: { timestamp: '2026-10-22T10:00:00Z', locale: 'en-GB', emptyLabel: 'Never', live: false },
	behaviour: function (t) {
		// A fixed clock: 2026-10-22 10:00:00 UTC.
		var nowMs = Date.parse('2026-10-22T10:00:00Z');
		function clock() {
			return nowMs;
		}
		var host = t.mount('rt-test-mount');
		var rt = new t.Ctor({ runtimeId: 'rt-test-mount', timestamp: '2026-10-22T09:55:00Z', locale: 'en', emptyLabel: 'Never', live: false, now: clock });
		var time = host.querySelector('time');

		t.check('renders a <time> element with the BEM class', time && time.className === 'relative-time__value');
		t.check('five minutes ago reads "5 minutes ago"', time.textContent === '5 minutes ago');
		t.check('the datetime attribute is the exact moment in ISO 8601', time.getAttribute('datetime') === '2026-10-22T09:55:00.000Z');
		t.check('the title shows the exact date and time', time.title.length > 0 && time.title !== time.textContent);

		rt.onParametersChanged({ timestamp: '2026-10-24T10:00:00Z' });
		t.check('two days ahead reads "in 2 days"', time.textContent === 'in 2 days');
		rt.onParametersChanged({ timestamp: '2026-10-21T10:00:00Z' });
		t.check('one day back reads "yesterday" (numeric: auto)', time.textContent === 'yesterday');
		rt.onParametersChanged({ timestamp: '2026-10-22T09:59:30Z' });
		t.check('30 seconds ago reads "30 seconds ago"', time.textContent === '30 seconds ago');

		rt.onParametersChanged({ locale: 'pt-PT', timestamp: '2026-10-25T10:00:00Z' });
		// The exact words come from the browser's locale data (pt-PT: "dentro de 3 dias"), so check it's translated, not the wording.
		t.check('the locale translates it (pt-PT)', /3/.test(time.textContent) && time.textContent !== 'in 3 days');

		nowMs = Date.parse('2026-10-22T10:02:00Z');
		rt.onParametersChanged({ locale: 'en', timestamp: '2026-10-22T10:00:00Z' });
		t.check('a moving clock updates the text on refresh', time.textContent === '2 minutes ago');
		nowMs = Date.parse('2026-10-22T11:00:00Z');
		rt.refresh();
		t.check('refresh() re-renders with the new time', time.textContent === '1 hour ago');

		rt.onParametersChanged({ timestamp: '' });
		t.check('an empty timestamp shows EmptyLabel', time.textContent === 'Never' && !time.hasAttribute('datetime'));
		rt.onParametersChanged({ timestamp: 'not a date' });
		t.check('an invalid timestamp shows EmptyLabel', time.textContent === 'Never');
		rt.onParametersChanged({ timestamp: '2026-10-22T10:00:00Z', locale: 'not_a_locale!' });
		t.check('an invalid locale falls back instead of throwing', time.textContent.length > 0);

		rt.onParametersChanged({ emptyLabel: '<img src=x onerror=alert(1)>', timestamp: '' });
		t.check('markup in data renders as text, not HTML', host.querySelector('img') === null && time.textContent.indexOf('<img') !== -1);

		rt.destroy();
		var threw = false;
		try {
			rt.refresh();
		} catch (e) {
			threw = true;
		}
		t.check('refresh after destroy is a safe no-op', !threw && host.querySelector('time') === null);
		host.remove();
	},
};

if (typeof module !== 'undefined') module.exports = componentTest;
