// ESLint for the components' TypeScript and the repo's build and test scripts.
// Formatting is Prettier's job, so eslint-config-prettier turns off the style rules.
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	{ ignores: ['**/dist/**', '**/node_modules/**'] },
	js.configs.recommended,
	// Component source: TypeScript running in the browser.
	{
		files: ['components/*/src/**/*.ts', 'templates/*/src/**/*.ts'],
		extends: [tseslint.configs.recommended],
		languageOptions: { globals: globals.browser },
		// Security: platform data enters the DOM through textContent only (Components.md, step 3).
		rules: {
			'no-restricted-properties': [
				'error',
				...['innerHTML', 'outerHTML', 'insertAdjacentHTML', 'createContextualFragment'].map((property) => ({
					property,
					message: 'Builds HTML from strings, so OutSystems data could inject markup. Create elements and set textContent instead.',
				})),
				{ object: 'document', property: 'write', message: 'Never document.write. Create elements and set textContent.' },
				{ object: 'document', property: 'writeln', message: 'Never document.writeln. Create elements and set textContent.' },
			],
			'no-eval': 'error',
			'no-implied-eval': 'error',
			'no-new-func': 'error',
		},
	},
	// Build scripts, test runners and repo scripts: Node ES modules.
	{
		files: ['**/*.mjs'],
		languageOptions: { globals: globals.node },
	},
	// Shared checks: a plain browser script (ES2017: var style, trailing commas allowed) that is also require()d by the test runner.
	{
		files: ['components/*/test/checks.js', 'templates/*/test/checks.js', 'packages/toolchain/structural-checks.js'],
		languageOptions: {
			sourceType: 'script',
			ecmaVersion: 2017,
			globals: { ...globals.browser, module: 'readonly' },
		},
		// ES5 needs a name in every catch, even when the error isn't used.
		rules: { 'no-unused-vars': ['error', { caughtErrors: 'none' }] },
	},
	prettier,
);
