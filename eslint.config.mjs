import js from '@eslint/js';
import ts from 'typescript-eslint';
import globals from 'globals';

export default ts.config(
  { ignores: ['**/dist', '**/dist-readable', '**/node_modules', '**/.next', '**/next-env.d.ts', 'coverage', 'tools/runner'] },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ['**/*.mjs'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['**/*.cjs'],
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
  },
  {
    // no-undef для TypeScript вимкнено, бо те саме ловить перевірка типів.
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: { globals: globals.browser },
    rules: { 'no-undef': 'off' },
  },
  {
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
);
