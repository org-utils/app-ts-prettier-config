/** @type {import('prettier').Config} */
export default {
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,

  semi: true,
  singleQuote: true,
  jsxSingleQuote: false,
  quoteProps: 'as-needed',

  trailingComma: 'all',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'always',

  endOfLine: 'lf',
  embeddedLanguageFormatting: 'auto',

  plugins: ['@trivago/prettier-plugin-sort-imports'],

  importOrder: [
    // React
    '^react$',
    '^react-dom$',

    // Node.js built-in modules
    '<BUILTIN_MODULES>',

    // Third-party packages
    '^@?\\w',

    // Internal aliases
    '^@/(.*)$',
    '^~/(.*)$',
    '^src/(.*)$',

    // Side-effect imports
    '^\\u0000',

    // Parent imports
    '^\\.\\.(?!/?$)',
    '^\\.\\./?$',

    // Same-folder imports
    '^\\./(?=.*/)(?!/?$)',
    '^\\.(?!/?$)',
    '^\\./?$',

    // Styles
    '\\.(css|scss|sass|less)$',
  ],

  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  importOrderCaseInsensitive: true,

  importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy'],
};
