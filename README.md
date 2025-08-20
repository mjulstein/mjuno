# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

# Shared Pantry (serverless)

The /test-sheet page uses Pantry (getpantry.cloud) as a simple shared key-value store. No server or env vars are required; configuration lives in the URL hash and in your browser.

How it works
- Store a single string value in a Pantry “basket” as JSON: { value: "..." }.
- Identify the basket with two values: Pantry ID (pid) and basket name (key).
- We read pid/key from the URL hash and also persist them to localStorage.

Hash parameters
- pid: Your Pantry ID (UUID)
- key: Basket name (e.g., test-sheet)

Example
- https://your-domain/test-sheet#pid=123e4567-e89b-12d3-a456-426614174000&key=test-sheet
- Use the Settings dialog on the page to fill these; it updates the URL so you can share/bookmark it.

Get started with Pantry
1) Open https://getpantry.cloud/ in a new tab and click “Create Pantry”.
2) Copy your Pantry ID (UUID).
3) Pick a basket name (key), e.g., test-sheet.
4) On /test-sheet, open Settings and paste the Pantry ID and basket name.
5) Save. The page updates the URL to include #pid and #key. Bookmark/share this link to access the same basket.

Local dev
```bash
npm install
npm run dev
```
Open http://localhost:5173/test-sheet and configure via Settings.

Notes
- Anyone with the link can read/write the basket. Don’t store sensitive data.
- If the basket doesn’t exist yet, saving will create it.
