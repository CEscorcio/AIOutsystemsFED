// DropdownButton's own checks: what it does, not the rules every component
// follows (those are in packages/toolchain/structural-checks.js and run first).
// Runs under jsdom (npm test) and in the preview page (preview/index.html?test=1).
var componentTest = {
	block: 'dropdown-button',
	osuiClasses: ['btn', 'btn-primary', 'btn-small'],
	config: { label: 'Label', variant: 'Primary', size: 'Medium', enabled: true, url: '', icon: '', menuLabel: 'More options' },
	behaviour: function (t) {
		// The mount as the Block renders it: the MenuContainer, with the screen's Links, inside.
		var host = t.mount('db-test-mount', 'dropdown-button');
		var menu = t.doc.createElement('div');
		menu.id = 'db-test-menu';
		menu.className = 'dropdown-button__menu';
		['Edit', 'Duplicate', 'Archive'].forEach(function (label) {
			var a = t.doc.createElement('a');
			a.href = '#';
			a.className = 'dropdown-button__item';
			a.textContent = label;
			menu.appendChild(a);
		});
		host.appendChild(menu);
		var outside = t.mount('db-test-outside');
		var clicks = 0;
		var db = new t.Ctor({
			runtimeId: 'db-test-mount',
			menuId: 'db-test-menu',
			label: 'Save',
			variant: 'Primary',
			size: 'Medium',
			enabled: true,
			url: '',
			icon: '',
			menuLabel: 'More save options',
			events: {
				OnClick: function () {
					clicks++;
				},
			},
		});
		var group = host.querySelector('.dropdown-button__group');
		var trigger = host.querySelector('.dropdown-button__trigger');
		var items = menu.querySelectorAll('a');
		function action() {
			return host.querySelector('.dropdown-button__action');
		}
		function isOpen() {
			return menu.classList.contains('dropdown-button__menu--is-open');
		}
		function key(el, name) {
			el.dispatchEvent(new t.win.KeyboardEvent('keydown', { key: name, bubbles: true }));
		}

		t.check('renders the buttons in front of the menu and leaves the menu in place', host.firstChild === group && host.lastChild === menu && menu.children.length === 3);
		t.check('both parts are OutSystems UI primary buttons', action().className.indexOf('btn btn-primary') === 0 && trigger.classList.contains('btn-primary'));
		t.check('the action is a button with the label', action().tagName === 'BUTTON' && action().textContent === 'Save');
		t.check(
			'the chevron is a disclosure: aria-expanded, aria-controls, MenuLabel as its name',
			trigger.getAttribute('aria-expanded') === 'false' && trigger.getAttribute('aria-controls') === 'db-test-menu' && trigger.getAttribute('aria-label') === 'More save options',
		);
		t.check('the menu starts closed', !isOpen() && !db.isOpen);

		action().click();
		t.check('the action raises OnClick and leaves the menu closed', clicks === 1 && !isOpen());

		trigger.click();
		t.check('the chevron opens the menu', isOpen() && db.isOpen && trigger.getAttribute('aria-expanded') === 'true' && trigger.classList.contains('dropdown-button__trigger--is-open'));
		trigger.click();
		t.check('the chevron closes it again', !isOpen() && trigger.getAttribute('aria-expanded') === 'false');

		key(trigger, 'ArrowDown');
		t.check('ArrowDown on the chevron opens the menu and focuses its first item', isOpen() && t.doc.activeElement === items[0]);
		key(items[0], 'ArrowDown');
		t.check('ArrowDown moves to the next item', t.doc.activeElement === items[1]);
		key(items[1], 'End');
		t.check('End moves to the last item', t.doc.activeElement === items[2]);
		key(items[2], 'ArrowDown');
		t.check('ArrowDown on the last item wraps to the first', t.doc.activeElement === items[0]);
		key(items[0], 'ArrowUp');
		t.check('ArrowUp on the first item wraps to the last', t.doc.activeElement === items[2]);
		key(items[2], 'Escape');
		t.check('Escape closes the menu and returns focus to the chevron', !isOpen() && t.doc.activeElement === trigger);

		trigger.click();
		items[1].click();
		t.check('choosing an item closes the menu', !isOpen());
		trigger.click();
		outside.click();
		t.check('a click outside closes the menu', !isOpen());
		trigger.click();
		menu.click();
		t.check('a click on the menu itself, not an item, keeps it open', isOpen());
		trigger.click();

		db.onParametersChanged({ variant: 'Secondary' });
		t.check(
			'Secondary is OutSystems UI btn, without btn-primary',
			action().classList.contains('btn') && !action().classList.contains('btn-primary') && group.classList.contains('dropdown-button__group--secondary'),
		);
		db.onParametersChanged({ variant: 'Tertiary' });
		t.check('Tertiary sets its group state', group.classList.contains('dropdown-button__group--tertiary') && !action().classList.contains('btn-primary'));
		db.onParametersChanged({ variant: 'Transparent' });
		t.check('Transparent sets its group state', group.classList.contains('dropdown-button__group--transparent'));
		db.onParametersChanged({ variant: 'Purple' });
		t.check('an unknown Variant uses Primary', group.classList.contains('dropdown-button__group--primary') && action().classList.contains('btn-primary'));

		db.onParametersChanged({ size: 'Small' });
		t.check(
			'Small is OutSystems UI btn-small on both parts',
			action().classList.contains('btn-small') && trigger.classList.contains('btn-small') && group.classList.contains('dropdown-button__group--small'),
		);
		db.onParametersChanged({ size: 'ExtraSmall' });
		t.check('ExtraSmall is btn-small plus its group state', action().classList.contains('btn-small') && group.classList.contains('dropdown-button__group--extra-small'));
		db.onParametersChanged({ size: 'Huge' });
		t.check('an unknown Size uses Medium', !action().classList.contains('btn-small') && group.classList.contains('dropdown-button__group--medium'));

		trigger.click();
		db.onParametersChanged({ enabled: false });
		t.check('Enabled = False disables both parts and closes the menu', action().disabled && trigger.disabled && !isOpen() && group.classList.contains('dropdown-button__group--is-disabled'));
		trigger.click();
		action().click();
		t.check('while disabled, neither part reacts', !isOpen() && clicks === 1);
		db.onParametersChanged({ enabled: true });

		db.onParametersChanged({ url: '/Sandbox/Orders' });
		t.check('a Url turns the action into a link', action().tagName === 'A' && action().getAttribute('href') === '/Sandbox/Orders' && action().textContent === 'Save');
		action().addEventListener('click', function (e) {
			e.preventDefault();
		});
		action().click();
		t.check('a link action does not raise OnClick', clicks === 1);
		db.onParametersChanged({ enabled: false });
		t.check('a disabled link loses its href and leaves the tab order', !action().hasAttribute('href') && action().getAttribute('aria-disabled') === 'true' && action().getAttribute('tabindex') === '-1');
		db.onParametersChanged({ enabled: true, url: 'javascript:alert(1)' });
		t.check('a javascript: Url is dropped: the action is a button again', action().tagName === 'BUTTON');
		db.onParametersChanged({ url: '' });
		action().click();
		t.check('without a Url the action raises OnClick again', clicks === 2);

		db.onParametersChanged({ icon: 'th-large' });
		var icon = host.querySelector('.dropdown-button__icon');
		t.check(
			'Icon adds a leading Font Awesome icon, hidden from screen readers',
			icon !== null && icon.classList.contains('fa-th-large') && icon.getAttribute('aria-hidden') === 'true' && action().firstChild === icon,
		);
		db.onParametersChanged({ icon: 'x" onmouseover="alert(1)' });
		t.check('an Icon that is not an icon name is ignored', host.querySelector('.dropdown-button__icon') === null);

		db.onParametersChanged({ menuLabel: '' });
		t.check('an empty MenuLabel falls back to "More options"', trigger.getAttribute('aria-label') === 'More options');
		db.onParametersChanged({ label: '<img src=x onerror=alert(1)>' });
		t.check('markup in data renders as text, not HTML', host.querySelector('img') === null && action().textContent.indexOf('<img') !== -1);

		trigger.click();
		db.destroy();
		t.check('destroy removes the buttons, closes the menu and leaves the menu in place', host.querySelector('.dropdown-button__group') === null && !isOpen() && host.firstChild === menu);
		outside.click();
		items[0].click();
		t.check('after destroy, the menu is left alone', !isOpen() && menu.children.length === 3);
		host.remove();
		outside.remove();
	},
};

if (typeof module !== 'undefined') module.exports = componentTest;
