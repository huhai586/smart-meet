const globals = require("globals");
const tseslint = require("typescript-eslint");
const react = require("eslint-plugin-react");
const reactHooks = require("eslint-plugin-react-hooks");
const prettier = require("eslint-config-prettier");

module.exports = tseslint.config(
    {
        ignores: ["node_modules/", ".plasmo/", "build/"],
    },
    ...tseslint.configs.recommended,
    {
        files: ["**/*.{js,jsx,ts,tsx}"],
        plugins: {
            react,
            "react-hooks": reactHooks,
        },
        settings: {
            react: {
                version: "detect",
            },
        },
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        rules: {
            ...react.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,
            "react/react-in-jsx-scope": "off",
            "react/prop-types": "off",
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-unused-vars": "warn",
            "prefer-const": "warn",
            "react/jsx-key": "warn",
            "react-hooks/exhaustive-deps": "warn",
            "react/display-name": "warn",
            "@typescript-eslint/no-namespace": "warn",
            "@typescript-eslint/no-unused-expressions": "warn",
            "react/no-unescaped-entities": "warn",
            "@typescript-eslint/ban-ts-comment": "warn",
            "@typescript-eslint/no-require-imports": "off"
        },
    },
    prettier,
);