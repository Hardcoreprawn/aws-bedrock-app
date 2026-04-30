import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  {
    ignores: ['**/dist/**', '**/build/**', '**/node_modules/**']
  },
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      globals: {
        ...globals.node
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
      // TypeScript's own checker handles undefined references more accurately than ESLint.
      'no-undef': 'off'
    }
  },
  {
    files: ['apps/web/src/**/*.tsx', 'apps/web/src/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.browser
      }
    }
  },
  {
    // Server processes legitimately use console for startup and request logging.
    files: ['apps/mock-api/src/**/*.ts'],
    rules: {
      'no-console': 'off'
    }
  }
];
