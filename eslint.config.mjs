import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.generated/**",
      "lib/api-client-react/src/generated/**",
      "lib/api-zod/src/generated/**",
      "artifacts/mockup-sandbox/**",
      "public/**",
      ".cache/**",
      ".config/**",
      ".local/**",
      ".agents/**",
    ],
  },
  {
    files: ["**/*.{js,mjs,ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: { "@typescript-eslint": tseslint.plugin },
    rules: {
      "no-constant-binary-expression": "error",
      "no-debugger": "error",
      "no-duplicate-imports": "error",
      "no-self-compare": "error",
      "no-unreachable-loop": "error",
      "no-useless-assignment": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-duplicate-enum-values": "error",
      "@typescript-eslint/no-non-null-asserted-optional-chain": "error",
      "@typescript-eslint/no-unnecessary-type-constraint": "error",
    },
  },
];
