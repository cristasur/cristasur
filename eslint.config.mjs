import { FlatCompat } from '@eslint/eslintrc'
import { fileURLToPath } from 'node:url'
import globals from 'globals'

const compat = new FlatCompat({ baseDirectory: fileURLToPath(new URL('.', import.meta.url)) })
export default [
  { ignores: ['node_modules/**', '.next/**', 'coverage/**', 'public/**'] },
  ...compat.extends('next/core-web-vitals'),
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      'no-undef': 'error',
      // Fotos externas del catálogo y previsualizaciones de archivos necesitan img.
      '@next/next/no-img-element': 'off',
      'react/no-unescaped-entities': 'off',
    },
  },
]
