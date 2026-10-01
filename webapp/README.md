# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

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

export default defineConfig([
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


## Design system

- **Tokens** live in `src/styles/tokens.css` (`@theme`): semantic colors (`text-label`, `text-label-secondary`, `bg-sys-blue`…), item-type colors (`text-type-flight`, `bg-type-hotel`…), radii, shadows and font sizes. Legacy `--sys-*` variables are aliased.
- **Themes** are `[data-theme="…"]` blocks in `src/styles/themes.css`; the root `data-theme` is set from the store.
- **Glass effects/keyframes** live in `src/styles/glass.css`; shell offsets in `src/styles/layout.css`.
- **Item types**: use `src/core/itemTypes.ts` for icons, colors and start/end labels.
- **UI components** (`src/components/ui`): `Button`, `IconButton` (requires `aria-label`), `Chip`/`Badge`, `LinkChip`, `Card`, `Modal`/`Sheet`, `EmptyState`, `Skeleton`, `toast()`. Combine classes with `cn()` from `src/lib/cn.ts`.
- `.tsx` files export components only (react-refresh lint); put helpers and cva variants in `.ts` files.

## Navigation

- Trip screens are defined once in `src/app/routes.ts` (`APP_ROUTES`); at most four are `primary` so the mobile tab bar (plus More and Settings) fits a 320px phone.
- `SETTINGS_ROUTE` (`/settings`, `SettingsScreen`) holds trips, export/share, appearance and sign-out. On mobile it also hosts the timeline search & type filters (`TimelineFilters`, state in `src/store/timelineFilters.ts`); on desktop they stay inline in the timeline header.

## Keyboard shortcuts

| Keys | Action |
| --- | --- |
| ⌘K / Ctrl+K, `/` | Command palette |
| `N` | New itinerary item |
| `J` / `K` | Next / previous timeline item |
| `Esc` | Close dialog |

## Flags

- `localStorage['vacay:debug'] = '1'` — enables `/debug` in production builds.
- `localStorage['vacay:ff:sharing'] = '1'` (or `VITE_FEATURE_SHARING=true`) — shows the Share sheet preview.

## Scripts

`npm run lint`, `npm run typecheck`, `npm run build`, `npm test`. Install with `npm ci --ignore-scripts` (firebase-tools' native postinstall can hang).
