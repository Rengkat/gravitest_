import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // React 19 warns ("Encountered a script tag while rendering React component") when the client creates a
  // <script>. All inline scripts go through Components/shared/InlineScript.tsx, which renders them server-only.
  {
    files: ["**/*.{ts,tsx,jsx}"],
    ignores: ["Components/shared/InlineScript.tsx", "**/__test__/**", "**/*.test.*"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXOpeningElement[name.name='script'], JSXOpeningElement[name.name='Script']",
          message:
            "Do not render <script>/<Script> directly (React 19 console warning). Use <InlineScript> from @/Components/shared/InlineScript.",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
