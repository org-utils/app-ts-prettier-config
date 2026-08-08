
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // ESLint recommended JavaScript rules
  eslint.configs.recommended,

  // Strict TypeScript rules
  tseslint.configs.strictTypeChecked,

  {
    name: 'org-utils/strict',

    files: ['**/*.{ts,tsx}'],

    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: process.cwd(),
      },
    },

    rules: {
      /*
       * TypeScript correctness
       */
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: {
            arguments: true,
            attributes: true,
            properties: true,
            returns: true,
            variables: true,
          },
        },
      ],

      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',

      /*
       * Explicit types
       */
      '@typescript-eslint/explicit-function-return-type': [
        'warn',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
          allowDirectConstAssertionInArrowFunctions: true,
        },
      ],

      /*
       * Code quality
       */
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports',
        },
      ],

      '@typescript-eslint/no-confusing-void-expression': 'error',

      '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',

      '@typescript-eslint/prefer-nullish-coalescing': [
        'error',
        {
          ignoreConditionalTests: true,
          ignoreMixedLogicalExpressions: true,
        },
      ],

      '@typescript-eslint/prefer-optional-chain': 'error',

      /*
       * Naming
       */
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'variable',
          modifiers: ['const'],
          format: ['camelCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'function',
          format: ['camelCase', 'PascalCase'],
        },
        {
          selector: 'parameter',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
      ],

      /*
       * JavaScript correctness
       */
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-constant-condition': 'error',
      'no-duplicate-imports': 'error',
      'no-self-compare': 'error',

      /*
       * Complexity / maintainability
       */
      complexity: ['warn', 15],
      'max-depth': ['warn', 4],
      'max-nested-callbacks': ['warn', 4],
      'max-params': ['warn', 5],
    },
  },

  /*
   * JavaScript files don't need TypeScript type-aware rules.
   */
  {
    name: 'org-utils/strict-javascript',

    files: ['**/*.{js,mjs,cjs}'],

    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },

  /*
   * Generated/build files.
   */
  {
    name: 'org-utils/strict-ignores',

    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/*.d.ts',
    ],
  },
);
