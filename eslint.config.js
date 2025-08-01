const globals = require("globals");
const tseslint = require("typescript-eslint");
const react = require("eslint-plugin-react");
const reactHooks = require("eslint-plugin-react-hooks");
const unusedImports = require("eslint-plugin-unused-imports");
const importPlugin = require("eslint-plugin-import");
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
            "unused-imports": unusedImports,
            "import": importPlugin,
        },
        settings: {
            react: {
                version: "detect",
            },
            "import/resolver": {
                typescript: {
                    alwaysTryTypes: true,
                    project: "./tsconfig.json",
                },
                node: {
                    extensions: [".js", ".jsx", ".ts", ".tsx"],
                },
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
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/no-unused-vars": "off", // Replaced by unused-imports
            "unused-imports/no-unused-imports": "error",
            "unused-imports/no-unused-vars": [
                "error",
                {
                    "vars": "all",
                    "varsIgnorePattern": "^_",
                    "args": "after-used",
                    "argsIgnorePattern": "^_",
                }
            ],
            "prefer-const": "warn",
            "react/jsx-key": "warn",
            "react-hooks/exhaustive-deps": "warn",
            "react/display-name": "warn",
            "@typescript-eslint/no-namespace": "warn",
            "@typescript-eslint/no-unused-expressions": "warn",
            "react/no-unescaped-entities": "warn",
            "@typescript-eslint/ban-ts-comment": "warn",
            "@typescript-eslint/no-require-imports": "off",
            // Import rules
            "import/no-unresolved": "error",
            "import/named": "error",
            "import/default": "error",
            "import/namespace": "error",
            "import/no-absolute-path": "error",
            "import/no-self-import": "error",
            "import/no-cycle": "warn",
            "import/no-useless-path-segments": "warn",
        },
    },
    // Test files configuration with relaxed rules
    {
        files: ["**/*.{test,spec}.{js,jsx,ts,tsx}", "**/test/**/*.{js,jsx,ts,tsx}", "**/tests/**/*.{js,jsx,ts,tsx}", "**/__tests__/**/*.{js,jsx,ts,tsx}"],
        plugins: {
            react,
            "react-hooks": reactHooks,
            "unused-imports": unusedImports,
            "import": importPlugin,
        },
        settings: {
            react: {
                version: "detect",
            },
            "import/resolver": {
                typescript: {
                    alwaysTryTypes: true,
                    project: "./tsconfig.json",
                },
                node: {
                    extensions: [".js", ".jsx", ".ts", ".tsx"],
                },
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
            "@typescript-eslint/no-explicit-any": "warn", // More relaxed for tests
            "@typescript-eslint/no-unused-vars": "off",
            "unused-imports/no-unused-imports": "error",
            "unused-imports/no-unused-vars": [
                "warn", // More relaxed for tests
                {
                    "vars": "all",
                    "varsIgnorePattern": "^_",
                    "args": "after-used",
                    "argsIgnorePattern": "^_",
                }
            ],
            "prefer-const": "warn",
            "react/jsx-key": "warn",
            "react-hooks/exhaustive-deps": "warn",
            "react/display-name": "warn",
            "@typescript-eslint/no-namespace": "warn",
            "@typescript-eslint/no-unused-expressions": "warn",
            "react/no-unescaped-entities": "warn",
            "@typescript-eslint/ban-ts-comment": "warn",
            "@typescript-eslint/no-require-imports": "off",
            // Import rules (more relaxed for tests)
            "import/no-unresolved": "warn",
            "import/named": "warn",
            "import/default": "warn",
            "import/namespace": "warn",
            "import/no-absolute-path": "warn",
            "import/no-self-import": "warn",
            "import/no-cycle": "warn",
            "import/no-useless-path-segments": "warn",
        },
    },
    prettier,
);