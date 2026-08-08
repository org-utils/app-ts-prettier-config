import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/.next/**",
      "**/.turbo/**",
      "**/.cache/**",
      "**/*.min.js",
    ],
  },

  js.configs.recommended,

  ...tseslint.configs.recommended,

  {
    files: ["**/*.{ts,tsx}"],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",

      globals: {
        ...globals.es2022,
      },

      parserOptions: {
        ecmaFeatures: {
          jsx: false,
        },
      },
    },

    rules: {
      /*
       * TypeScript
       */

      "@typescript-eslint/no-explicit-any": "warn",

      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      "@typescript-eslint/no-non-null-assertion": "warn",

      /*
       * General
       */

      "no-console": "warn",

      "no-debugger": "error",

      "no-var": "error",

      "prefer-const": "error",

      "object-shorthand": "error",

      "prefer-template": "error",

      "no-duplicate-imports": "error",

      "no-unreachable": "error",

      "no-constant-condition": "error",
    },
  },
);
