module.exports = {
    "env": {
        "browser": true,
        "es6": true
    },
    "extends": [
        "plugin:react/recommended",
        "plugin:@typescript-eslint/eslint-recommended"
    ],
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly"
    },
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaFeatures": {
            "jsx": true
        },
        "ecmaVersion": 2018,
        "sourceType": "module"
    },
    "plugins": [
        "react",
        "@typescript-eslint",
        //"simple-import-sort"
    ],
    "rules": {
        "react/jsx-uses-react": "error",   
        "react/jsx-uses-vars": "error",
        "react/prop-types": 0,
        "quotes": ["warn", "single"],
        "keyword-spacing": "warn",
        "space-before-blocks": "warn",
        "comma-dangle": "warn",
        //"simple-import-sort/sort": "warn",
        "no-multi-spaces": "warn",
        "comma-spacing": ["warn", { "before": false, "after": true }],
        "prefer-const": ["warn", {"destructuring": "all"}],
        "no-var": "warn"
    },
    "settings": {
        "react": {
            "pragma": "React",
            "version": "detect",
        }
    },
    "ignorePatterns": ["node_modules", "./static/buffer", "./static/themes"]
};