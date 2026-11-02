// Sparkline's own checks: what it does, not the rules every component follows
// (those are in packages/toolchain/structural-checks.js and run first).
// Runs under jsdom (npm test) and in the preview page (preview/index.html?test=1).
var componentTest = {
	block: 'sparkline',
	osuiClasses: [],
	config: { values: '1,2,3', label: 'Trend', showLast: true },
	behaviour: function (t) {
		var host = t.mount('sl-test-mount');
		var line = new t.Ctor({ runtimeId: 'sl-test-mount', values: '3, 5; 2 8', label: 'Orders', showLast: true });
		var svg = host.querySelector('svg');
		var path = host.querySelector('.sparkline__line');
		var dot = host.querySelector('.sparkline__dot');
		function points() {
			return (path.getAttribute('d').match(/[ML]/g) || []).length;
		}

		t.check('draws an SVG chart with the BEM class', svg && svg.getAttribute('class') === 'sparkline__chart');
		t.check('commas, semicolons and spaces all separate values (4 points)', points() === 4);
		t.check('the lowest value is drawn at the bottom and the highest at the top', /L[\d.]+ 22 L[\d.]+ 2$/.test(path.getAttribute('d')));
		t.check('the stroke keeps its width when the SVG stretches', path.getAttribute('vector-effect') === 'non-scaling-stroke');
		t.check('the last point gets a dot', dot.getAttribute('cx') === '98' && dot.getAttribute('cy') === '2' && dot.style.display === '');
		t.check('screen readers get the label with the first and last values', svg.getAttribute('role') === 'img' && svg.getAttribute('aria-label') === 'Orders: 3 to 8');

		line.onParametersChanged({ showLast: false });
		t.check('ShowLast false hides the dot', dot.style.display === 'none');

		line.onParametersChanged({ values: '4,4,4' });
		t.check('a flat series draws a flat line in the middle', path.getAttribute('d') === 'M2 12 L50 12 L98 12');

		line.onParametersChanged({ values: '1.5, x, 2.5, , NaN' });
		t.check('non-numbers are dropped; decimals use a dot', points() === 2 && svg.getAttribute('aria-label') === 'Orders: 1.5 to 2.5');

		line.onParametersChanged({ values: '7' });
		t.check('fewer than two values draw nothing', svg.style.display === 'none' && path.getAttribute('d') === '');

		line.onParametersChanged({ values: '1,2', label: '' });
		t.check('without a label, screen readers still get the values', svg.getAttribute('aria-label') === '1 to 2');

		line.onParametersChanged({ label: '<img src=x onerror=alert(1)>' });
		t.check('markup in data stays an attribute value, not HTML', host.querySelector('img') === null);

		line.destroy();
		t.check('destroy removes the SVG', host.querySelector('svg') === null);
		host.remove();
	},
};

if (typeof module !== 'undefined') module.exports = componentTest;
