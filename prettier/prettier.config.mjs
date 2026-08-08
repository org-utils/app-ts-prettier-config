/** @type {import('prettier').Config} */
export default {
// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

printWidth: 100,
tabWidth: 2,
useTabs: false,

// ---------------------------------------------------------------------------
// JavaScript / TypeScript
// ---------------------------------------------------------------------------

semi: true,
singleQuote: true,
jsxSingleQuote: false,
quoteProps: 'as-needed',

// ---------------------------------------------------------------------------
// Trailing commas / brackets
// ---------------------------------------------------------------------------

trailingComma: 'all',
bracketSpacing: true,
bracketSameLine: false,
arrowParens: 'always',

// ---------------------------------------------------------------------------
// Files
// ---------------------------------------------------------------------------

endOfLine: 'lf',
embeddedLanguageFormatting: 'auto',

// ---------------------------------------------------------------------------
// File-specific overrides
// ---------------------------------------------------------------------------

overrides: [
{
files: ['*.json', '*.jsonc'],
options: {
tabWidth: 2,
singleQuote: false,
},
},


{
  files: ['*.md', '*.mdx'],
  options: {
    proseWrap: 'preserve',
  },
},

{
  files: ['*.yml', '*.yaml'],
  options: {
    singleQuote: false,
  },
},


],
};
