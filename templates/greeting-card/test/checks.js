// GreetingCard's own checks: what it does, not the rules every component
// follows (those are in packages/toolchain/structural-checks.js and run first).
// Runs under jsdom (npm test) and in the preview page (preview/index.html?test=1).
//
//   block        the BEM block, as in component.json
//   osuiClasses  the OutSystems UI classes the component may render, next to its BEM ones
//   config       a valid configuration (without runtimeId) the structural checks use
//   behaviour(t) the component's own checks. t gives check(name, ok), win, doc,
//                Ctor (the class), mount(id, className) and config(id)
var componentTest = {
	block: 'greeting-card',
	osuiClasses: ['card', 'btn', 'btn-primary'],
	config: { name: 'Ada', buttonLabel: 'Say hi' },
	behaviour: function (t) {
		var host = t.mount('gc-test-mount');
		var clicks = [];
		var card = new t.Ctor({
			runtimeId: 'gc-test-mount',
			name: 'Ada',
			buttonLabel: 'Say hi',
			events: {
				OnGreetClicked: function (n) {
					clicks.push(n);
				},
			},
		});
		var title = host.querySelector('.greeting-card__title');
		var button = host.querySelector('button');
		var count = host.querySelector('.greeting-card__count');

		t.check('uses OutSystems UI card and button classes', host.querySelector('.card') !== null && button && button.classList.contains('btn-primary'));
		t.check('button carries its BEM element class', button && button.classList.contains('greeting-card__button'));
		t.check('shows the name', title && title.textContent === 'Hello, Ada!');
		t.check('shows the button label', button && button.textContent === 'Say hi');
		t.check('starts at zero greetings', count && count.textContent === 'Greeted 0 times');

		button.click();
		t.check('click fires OnGreetClicked with count 1', clicks.length === 1 && clicks[0] === 1);
		t.check('click updates the count (singular)', count.textContent === 'Greeted 1 time');
		button.click();
		t.check('second click fires with count 2', clicks[1] === 2 && count.textContent === 'Greeted 2 times');

		card.onParametersChanged({ name: 'Grace' });
		t.check('onParametersChanged updates the name', title.textContent === 'Hello, Grace!');
		t.check('onParametersChanged keeps the button label', button.textContent === 'Say hi');
		t.check('onParametersChanged keeps the count', count.textContent === 'Greeted 2 times');

		card.onParametersChanged({ name: '', buttonLabel: '' });
		t.check('empty name and label fall back', title.textContent === 'Hello, there!' && button.textContent === 'Greet');

		card.onParametersChanged({ name: '<img src=x onerror=alert(1)>' });
		t.check('markup in data renders as text, not HTML', host.querySelector('img') === null && title.textContent.indexOf('<img') !== -1);

		card.destroy();
		button.click();
		t.check('destroy removes the click listener', clicks.length === 2);
		host.remove();
	},
};

if (typeof module !== 'undefined') module.exports = componentTest;
