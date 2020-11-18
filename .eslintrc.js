// eslint-disable-next-line no-undef
module.exports = {
    extends: [
      "eslint:recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:react-hooks/recommended",
      "plugin:react/recommended",
    ],
    parser: "@typescript-eslint/parser",
    plugins: ["react-hooks", "@typescript-eslint", "prettier", "react"],
    settings: {
      "import/parsers": {
        "@typescript-eslint/parser": [".ts", ".tsx"],
      },
      "import/resolver": {
        typescript: {},
      },
      react: {
        version: "detect",
      },
    },
    rules: {
      "max-len": ["error", {code: 100}],
      "operator-linebreak": ["error", "before"],
      "array-bracket-spacing": ["error", "never"],
      "object-curly-spacing": ["error", "never"],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/naming-convention": [
        "error",
        {selector: "variable", format: ["camelCase", "UPPER_CASE"]},
        {selector: "function", format: ["PascalCase"]},
        {
          selector: "parameter",
          format: ["camelCase"],
          filter: {
            regex: "^__",
            match: false,
          },
        },
        {selector: "interface", format: ["PascalCase"], custom: {regex: "^I[A-Z]", match: false}},
      ],
    },
  };
