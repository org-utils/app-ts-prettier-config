import baseConfig from './prettier.config.mjs';

/** @type {import('prettier').Config} */
export default {
...baseConfig,

plugins: ['@trivago/prettier-plugin-sort-imports'],

importOrder: [
// Side-effect imports
'^\u0000',

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

importOrderParserPlugins: [
'typescript',
'jsx',
'decorators-legacy',
],
};
