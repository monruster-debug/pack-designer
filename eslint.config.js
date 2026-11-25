import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist/**', '.qa/**'] },
  js.configs.recommended,
  { files: ['**/*.js'], languageOptions: { globals: globals.browser } },
  { files: ['*.mjs', 'scripts/**/*.{js,mjs,cjs}', '*.config.js'], languageOptions: { globals: globals.node } },
  { files: ['scripts/check-motion.mjs'], languageOptions: { globals: { document: 'readonly' } } },
  {
    files: ['**/*.{js,mjs,cjs}'],
    rules: {
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', ignoreRestSiblings: true }],
      'constructor-super': 'error',
      'for-direction': 'error',
      'getter-return': 'error',
      'no-async-promise-executor': 'error',
      'no-compare-neg-zero': 'error',
      'no-cond-assign': ['error', 'except-parens'],
      'no-const-assign': 'error',
      'no-dupe-args': 'error',
      'no-dupe-class-members': 'error',
      'no-dupe-keys': 'error',
      'no-duplicate-case': 'error',
      'no-func-assign': 'error',
      'no-import-assign': 'error',
      'no-promise-executor-return': 'error',
      'no-unreachable': 'error',
      'no-unsafe-finally': 'error',
      'use-isnan': 'error',
      'valid-typeof': 'error',
    },
  },
];
