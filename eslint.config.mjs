import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

const rawLocatorCalls = ['locator', 'getByRole', 'getByText', 'getByTestId', 'getByLabel', 'getByPlaceholder', 'getByAltText', 'getByTitle'];

export default tseslint.config(
  { ignores: ['toolshop/', 'node_modules/', 'playwright-report/', 'test-results/', '.auth/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { languageOptions: { globals: { ...globals.node } } },
  {
    ...playwright.configs['flat/recommended'],
    files: ['tests/**/*.ts', 'fixtures/**/*.ts'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // Assertions live in page object methods named expect*.
      'playwright/expect-expect': ['warn', { assertFunctionPatterns: ['^expect[A-Z]\\w*$', '\\.expect[A-Z]\\w*$'] }],
    },
  },
  {
    // Convention: raw locators live in pages/, never in specs.
    files: ['tests/**/*.spec.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: `CallExpression[callee.property.name=/^(${rawLocatorCalls.join('|')})$/]`,
          message: 'Do not build locators in specs. Add a readonly locator and action method to a page object in pages/.',
        },
      ],
    },
  },
);
