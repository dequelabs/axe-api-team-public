const typescriptParser = require('@typescript-eslint/parser')
const typescriptPlugin = require('@typescript-eslint/eslint-plugin')
const globals = require('globals')
const eslint = require('@eslint/js')
const tseslint = require('typescript-eslint')

module.exports = [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parser: typescriptParser,
      globals: {
        ...globals.node,
        ...globals.es2015
      }
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin
    }
  },
  {
    files: ['eslint.config.js'],
    rules: {
      '@typescript-eslint/no-var-requires': 'off'
    }
  },
  {
    ignores: ['**/node_modules/', '**/dist/', '**/coverage/', '**/.nyc_output/']
  }
]
