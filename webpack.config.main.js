const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require("copy-webpack-plugin");

const mode = process.env.NODE_ENV || "development";
const staticPath =
  mode === "production" ?
    "`${path.join(process.resourcesPath, 'static')}`" :
    "'static'";

module.exports = {
  mode,
  target: 'electron-main',
  devtool: 'cheap-module-source-map',
  entry: './src/main/index.ts',
  output: {
    globalObject: 'this',
    filename: 'index.js',
    path: path.resolve(__dirname, 'build'),
    publicPath: '',
    clean: true
  },
  optimization: {
    minimize: false,
  },
  module: {
    rules: [
      {
        test: /\.(m|j|t)s$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  },
  plugins: [
    new webpack.ContextReplacementPlugin(/knex|express/),
    new webpack.DefinePlugin({ '__static': staticPath }),
    new CopyPlugin({
      patterns: [ { from: "static/icons", to: "appx/" } ],
    }),
  ],
  resolve: {
    extensions: ['.ts', '.js']
  },
  externals: { knex: 'commonjs knex', "browser-sync": 'commonjs browser-sync' }
};