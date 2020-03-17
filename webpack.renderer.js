const PrettierPlugin = require('prettier-webpack-plugin');

module.exports = {
    plugins: [
        new PrettierPlugin({
            printWidth: 80,
            tabWidth: 4,
            semi: true,
            singleQuote: true,
            jsxSingleQuote: false,
            bracketSpacing: true
        })
    ]
};