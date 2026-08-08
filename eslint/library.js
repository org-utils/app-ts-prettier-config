import base from "./base.js";

export default [
  ...base,

  {
    files: ["**/*.{ts,tsx}"],

    rules: {
      "@typescript-eslint/no-explicit-any": "error",

      "@typescript-eslint/no-non-null-assertion": "error",

      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "separate-type-imports",
        },
      ],

      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrors: "none",
        },
      ],

      "no-console": "warn",
    },
  },
];
