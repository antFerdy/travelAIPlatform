import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      'dist',
      'coverage',
      'playwright-report',
      'test-results',
      // Генерируется msw при установке, править нельзя
      'public/mockServiceWorker.js',
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Правила из ai-rules/frontend.md → System Rules
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Данные — только через src/api. Прямой fetch вне адаптеров запрещён.
      'no-restricted-globals': [
        'error',
        {
          name: 'fetch',
          message:
            'Прямой fetch запрещён вне src/api/adapters. Используйте `api` из src/api.',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/api/adapters/*'],
              message:
                'Импортируйте `api` из src/api — конкретный адаптер выбирается по VITE_API_MODE.',
            },
          ],
        },
      ],
    },
  },
  // Адаптерам fetch разрешён — это их работа.
  {
    files: ['src/api/**'],
    rules: {
      'no-restricted-globals': 'off',
      'no-restricted-imports': 'off',
    },
  },
  // Тесты и e2e: node-окружение, доступ к внутренностям разрешён.
  {
    files: ['**/*.test.{ts,tsx}', 'src/test/**', 'e2e/**', '*.config.{ts,js}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      'no-restricted-globals': 'off',
      'no-restricted-imports': 'off',
    },
  },
)
