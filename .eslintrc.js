module.exports = {
    env: {
      node: true,
      es6: true,
      jest: true,
    },
    extends: ['eslint:recommended'],
    parserOptions: {
      ecmaVersion: 2021,
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': 'off',
    },
  };
  