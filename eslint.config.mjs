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
		files: ['components/*/src/**/*.ts'],
		extends: [tseslint.configs.recommended],
		languageOptions: { globals: globals.browser },
	},
	// Build scripts, test runners and repo scripts: Node ES modules.
	{
		files: ['**/*.mjs'],
		languageOptions: { globals: globals.node },
	},
	// Shared checks: a plain browser script (ES2017: var style, trailing commas allowed) that is also require()d by the test runner.
	{
		files: ['components/*/test/checks.js'],
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
