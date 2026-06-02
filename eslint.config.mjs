const ignores = [
  "node_modules/**",
  ".next/**",
  "out/**",
  "dist/**",
  "build/**",
  "coverage/**",
  "*.tsbuildinfo",
  "next-env.d.ts",
];

export default [
  {
    ignores,
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {},
  },
  // TypeScript/TSX parsing requires optional ESLint parser dependencies that are not
  // part of this repo; `npm run lint` runs `tsc --noEmit` for TS/TSX validation.
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["**/*.{ts,tsx}"],
  },
];
