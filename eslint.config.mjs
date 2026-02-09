module.exports = {
  extends: [
    'next/core-web-vitals',
    'eslint:recommended',
    'prettier',
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    }
  },
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  rules: {
    'react/jsx-no-target-blank': 'off',
    'react/no-unknown-property': 'off',
  },
  ignorePatterns: [
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]
};
