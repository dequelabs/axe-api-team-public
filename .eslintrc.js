module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:mocha/recommended'
  ],
  rules: {
    '@typescript-eslint/camelcase': 'off',
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    'mocha/no-mocha-arrows': 'off',
    'mocha/no-setup-in-describe': 'off',
    // We export test functions / utilities to be used in other tests within the same repo
    'mocha/no-exports': 'off',
    'mocha/no-exclusive-tests': 'error'
  },
  env: {
    node: true,
    es6: true
  }
}
