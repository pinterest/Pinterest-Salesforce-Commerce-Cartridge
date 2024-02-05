module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:es5/no-es2015"
  ],
  "plugins": [
    "es5"
  ],
  overrides: [
    {
      env: {
        node: true,
      },
      files: [
        '.eslintrc.{js,cjs}',
      ],
      parserOptions: {
        sourceType: 'script',
      },
    },
  ],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  "globals": {
    "dw": true,
    "pintrk": true,
    "request": true,
    "session": true,
    "$": true
  },
  rules: {
  },
};
