// ReadMore's own checks: what it does, not the rules every component follows
// (those are in packages/toolchain/structural-checks.js and run first).
// Runs under jsdom (npm test) and in the preview page (preview/index.html?test=1).
// jsdom has no layout, so the "text fits, hide the toggle" path is only
// exercised in a real browser (the preview page).
var componentTest = {
	block: 'read-more',
	osuiClasses: [],
	config: { text: 'Some long text', lines: 3, moreLabel: 'More', lessLabel: 'Less' },
	behaviour: function (t) {
		var host = t.mount('rm-test-mount');
		var toggles = [];
		var rm = new t.Ctor({
			runtimeId: 'rm-test-mount',
			text: 'Line one\nLine two',
			lines: 2,
			moreLabel: 'More',
			lessLabel: 'Less',
			events: {
				OnToggled: function (isExpanded) {
					toggles.push(isExpanded);
				},
			},
		});
		var text = host.querySelector('.read-more__text');
		var toggle = host.querySelector('button');

		t.check('shows the text, line breaks kept', text.textContent === 'Line one\nLine two');
		t.check('starts collapsed to Lines lines', text.classList.contains('read-more__text--is-clamped') && text.style.getPropertyValue('-webkit-line-clamp') === '2');
		t.check('the toggle is a button saying MoreLabel', toggle.type === 'button' && toggle.textContent === 'More' && !toggle.hidden);
		t.check('the toggle says what it controls and its state', toggle.getAttribute('aria-controls') === text.id && toggle.getAttribute('aria-expanded') === 'false');

		toggle.click();
		t.check('clicking expands the text', rm.isExpanded && !text.classList.contains('read-more__text--is-clamped') && text.style.getPropertyValue('-webkit-line-clamp') === '');
		t.check('expanded, the toggle says LessLabel', toggle.textContent === 'Less' && toggle.getAttribute('aria-expanded') === 'true');
		t.check('OnToggled says it is expanded', toggles.length === 1 && toggles[0] === true);
		toggle.click();
		t.check('clicking again collapses it, and OnToggled says so', !rm.isExpanded && toggles[1] === false && toggle.textContent === 'More');

		rm.onParametersChanged({ lines: 0 });
		t.check('Lines of 0 or less uses 3', text.style.getPropertyValue('-webkit-line-clamp') === '3');
		rm.onParametersChanged({ moreLabel: '' });
		t.check('an empty MoreLabel falls back', toggle.textContent === 'Show more');
		rm.onParametersChanged({ text: '' });
		t.check('empty text hides the toggle', toggle.hidden);

		rm.onParametersChanged({ text: '<img src=x onerror=alert(1)>' });
		t.check('markup in data renders as text, not HTML', host.querySelector('img') === null && text.textContent.indexOf('<img') !== -1);

		var second = new t.Ctor({ runtimeId: 'rm-test-mount', text: 'x' });
		t.check('two instances get different ids for aria-controls', host.querySelector('.read-more__text').id !== text.id);
		second.destroy();

		rm.destroy();
		toggle.click();
		t.check('destroy removes the click listener', toggles.length === 2);
		host.remove();
	},
};

if (typeof module !== 'undefined') module.exports = componentTest;
