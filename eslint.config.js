import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tsEslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'
import prettierRecommended from 'eslint-plugin-prettier/recommended';

export default tsEslint.config([
  globalIgnores(['dist']),
  {
    extends: [
      js.configs.recommended,
      tsEslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
      files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
    // Enable Prettier as an ESLint rule and config
    prettierRecommended
])
