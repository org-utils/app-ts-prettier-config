import globals from "globals";
import base from "./base.js";

export default [
  ...base,

  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],

    languageOptions: {
      globals: {
        ...globals.node,
      },
    },

    rules: {
      "no-process-exit": "error",

      "no-console": "off",
    },
  },
];
