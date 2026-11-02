// The checks every component must pass, whatever it does: the Style.md rules a
// script can check on its rendered DOM and its stylesheet, and the lifecycle
// rules of Components.md (container classes untouched, no injected CSS, safe
// destroy). A component's own test/checks.js adds its behaviour checks.
//
// A plain browser script (ES2017, var style), so the same file runs under
// jsdom (npm test, through packages/toolchain/test.mjs) and in a component's
// preview page (preview/index.html?test=1).
//
//   runComponentChecks(win, Ctor, spec, options) -> [{ name, ok, skipped? }]
//     Ctor     the component's class, as registered on window.<namespace>
//     spec     the component's test/checks.js (componentTest):
//              { block, osuiClasses, config, behaviour(t) }
//     options  { label, css, osuiTokens }: css is the built stylesheet's text and
//              osuiTokens the base theme's :root variables; without them (the
//              preview page) the CSS checks are reported as skipped.
function runComponentChecks(win, Ctor, spec, options) {
	options = options || {};
	var doc = win.document;
	var results = [];
	var hasCss = typeof options.css === 'string' && !!options.osuiTokens;
	var block = spec.block;
	function check(name, ok) {
		results.push({ name: name, ok: !!ok });
	}
	function checkCss(name, ok) {
		if (hasCss) check(name, ok);
		else results.push({ name: name, ok: true, skipped: true });
	}
	function mount(id, className) {
		var el = doc.createElement('div');
		el.id = id;
		if (className) el.className = className;
		doc.body.appendChild(el);
		return el;
	}
	function configFor(id) {
		var c = { runtimeId: id };
		Object.keys(spec.config || {}).forEach(function (k) {
			c[k] = spec.config[k];
		});
		return c;
	}
	var BEM = new RegExp('^' + block + '(__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?$');
	var stylesBefore = doc.querySelectorAll('style, link[rel=stylesheet]').length;

	check('bundle registers ' + (options.label || 'the class'), typeof Ctor === 'function');
	if (typeof Ctor !== 'function') return results;

	// Rendering: inside the mount, and every class BEM under the block or an allowed OutSystems UI class.
	var host = mount('factory-test-mount');
	var instance = new Ctor(configFor('factory-test-mount'));
	check('renders inside the mount container', host.querySelector('[class^="' + block + '__"], [class*=" ' + block + '__"]') !== null);
	var allowed = spec.osuiClasses || [];
	var offenders = [];
	Array.prototype.forEach.call(host.querySelectorAll('[class]'), function (el) {
		Array.prototype.forEach.call(el.classList, function (c) {
			if (allowed.indexOf(c) === -1 && !BEM.test(c) && offenders.indexOf(c) === -1) offenders.push(c);
		});
	});
	check('every component class is BEM or OutSystems UI' + (offenders.length ? ' (' + offenders.join(', ') + ')' : ''), offenders.length === 0);

	// The component's own behaviour.
	if (typeof spec.behaviour === 'function') {
		spec.behaviour({ check: check, win: win, doc: doc, Ctor: Ctor, mount: mount, config: configFor });
	}
	check('the component adds no stylesheet (its CSS ships as a stylesheet of its own)', doc.querySelectorAll('style, link[rel=stylesheet]').length === stylesBefore);

	// The stylesheet (Style.md). Every OutSystems UI variable is used with a fallback
	// equal to its base-theme value; values compare without spaces or leading zeros,
	// so "0 1px 2px rgba(0, 0, 0, .1)" equals "0 1px 2px rgba(0, 0, 0, 0.1)".
	var css = hasCss ? options.css : '';
	var tokens = options.osuiTokens || {};
	function sameValue(a, b) {
		function norm(v) {
			return String(v)
				.replace(/\s+/g, '')
				.replace(/(^|[^0-9.])0\./g, '$1.')
				.toLowerCase();
		}
		return norm(a) === norm(b);
	}
	// eslint-disable-next-line no-control-regex -- matching the whole ASCII range is intended
	var nonAscii = css.match(/[^\x00-\x7F]/);
	checkCss('the stylesheet is ASCII-only' + (nonAscii ? ' (' + JSON.stringify(nonAscii[0]) + ')' : ''), !nonAscii);
	checkCss("the stylesheet styles the block's elements (." + block + '__*)', new RegExp('\\.' + block + '__[a-z0-9-]+[^{]*\\{').test(css));
	var VAR_WITH_FALLBACK = /var\((--[a-z0-9-]+)\s*(?:,\s*([^()]*(?:\([^()]*\))?[^()]*))?\)/g;
	var tokenProblems = [];
	var m;
	while ((m = VAR_WITH_FALLBACK.exec(css)) !== null) {
		if (!(m[1] in tokens)) tokenProblems.push(m[1] + ' is not a known OutSystems UI token');
		else if (m[2] === undefined) tokenProblems.push(m[1] + ' has no fallback');
		else if (!sameValue(m[2].trim(), tokens[m[1]])) tokenProblems.push(m[1] + ' fallback ' + m[2].trim() + ' != ' + tokens[m[1]]);
	}
	checkCss('every variable is an OutSystems UI token with its base-theme fallback' + (tokenProblems.length ? ' (' + tokenProblems.join('; ') + ')' : ''), tokenProblems.length === 0);
	var rawColours = css.replace(VAR_WITH_FALLBACK, '').match(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/g);
	checkCss('no raw colour outside a variable fallback' + (rawColours ? ' (' + rawColours.join(', ') + ')' : ''), !rawColours);
	checkCss('no !important', css.indexOf('!important') === -1);

	// Style.md Rule 3: one BEM class of this block, prefixed at most by a modifier or
	// state of the block, or by one OutSystems UI context class.
	var OSUI_CONTEXT = ['.desktop', '.tablet', '.phone', '.landscape', '.portrait', '.is-rtl', '.has-accessible-features', '.os-high-contrast'];
	var badSelectors = [];
	var cssNoComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
	var RULE = /([^{}]+)\{[^{}]*\}/g;
	var r;
	while ((r = RULE.exec(cssNoComments)) !== null) {
		r[1].split(',').forEach(function (raw) {
			var sel = raw.trim();
			if (!sel || sel.charAt(0) === '@') return;
			var parts = sel
				.replace(/::?[a-z-]+(\([^)]*\))?/g, '')
				.trim()
				.split(/\s+/);
			var last = parts[parts.length - 1];
			var prefix = parts.length === 2 ? parts[0] : null;
			var ok =
				parts.length <= 2 &&
				/^\.[a-z0-9_-]+$/.test(last) &&
				BEM.test(last.slice(1)) &&
				(prefix === null || OSUI_CONTEXT.indexOf(prefix) !== -1 || (/^\.[a-z0-9_-]+$/.test(prefix) && BEM.test(prefix.slice(1)) && prefix.indexOf('--') !== -1));
			if (!ok) badSelectors.push(sel);
		});
	}
	checkCss(
		'every selector is one BEM class, prefixed at most by a modifier or OutSystems UI context class' + (badSelectors.length ? ' (' + badSelectors.join(' | ') + ')' : ''),
		badSelectors.length === 0,
	);
	// Rule 5: direction through logical properties only.
	var physical = cssNoComments.match(/(^|[\s;{])(left|right|(margin|padding|border)-(left|right)[a-z-]*)\s*:|text-align\s*:\s*(left|right)/g);
	checkCss('no left/right properties (use logical properties)' + (physical ? ' (' + physical.join(', ').replace(/[\s;{]/g, '') + ')' : ''), !physical);
	// Rule 6: focus belongs to OutSystems UI; motion has a reduced-motion override.
	checkCss('no focus styles and no outline removal', !/:focus/.test(cssNoComments) && !/outline\s*:\s*(none|0)\b/.test(cssNoComments));
	checkCss('transitions and animations have a prefers-reduced-motion override', !/(transition|animation)\s*:/.test(cssNoComments) || cssNoComments.indexOf('prefers-reduced-motion') !== -1);
	// Rule 4: widths switch on OutSystems UI device classes, not media queries.
	checkCss('no width media queries (use .phone / .tablet)', !/@media[^{]*(min|max)-width/.test(cssNoComments));

	// The Block's main container carries the block class plus ExtendedClass, set
	// through its Style Classes. The component must leave them alone and never apply
	// ExtendedClass itself, or every class would be applied twice.
	var host2 = mount('factory-test-mount-2', block + ' my-theme');
	var second = new Ctor(configFor('factory-test-mount-2'));
	check('a second instance adds no stylesheet either', doc.querySelectorAll('style, link[rel=stylesheet]').length === stylesBefore);
	check('container classes (block class + ExtendedClass) are untouched on create', host2.className === block + ' my-theme');
	second.onParametersChanged(spec.config || {});
	check('container classes are untouched on update', host2.className === block + ' my-theme');
	check('ExtendedClass is not applied inside the component', host2.querySelector('.my-theme') === null);
	second.destroy();
	check('container classes are untouched on destroy', host2.className === block + ' my-theme');

	// Destroy: removes what it rendered; later calls are no-ops; a missing mount fails clearly.
	instance.destroy();
	check('destroy removes the component', host.children.length === 0);
	var threw = false;
	try {
		instance.onParametersChanged(spec.config || {});
		instance.destroy();
	} catch (e) {
		threw = true;
	}
	check('calls after destroy are safe', !threw);
	var missing = false;
	try {
		new Ctor(configFor('factory-test-missing-mount'));
	} catch (e) {
		missing = true;
	}
	check('missing mount id throws a clear error', missing);

	host.remove();
	host2.remove();
	return results;
}

if (typeof module !== 'undefined') module.exports = runComponentChecks;
