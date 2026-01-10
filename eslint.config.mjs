import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Disable rules that conflict with Prettier
      "@typescript-eslint/quotes": "off",
      "react/jsx-quotes": "off",
      // Allow unused vars with underscore prefix
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" },
      ],
      // Catch explicit any as an error
      "@typescript-eslint/no-explicit-any": "error",
      // Allow empty interfaces (useful for extending)
      "@typescript-eslint/no-empty-interface": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
  ]),
]);

export default eslintConfig;
