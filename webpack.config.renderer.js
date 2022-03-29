const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const PrettierPlugin = require('prettier-webpack-plugin');
const webpack = require('webpack');

const mode = process.env.NODE_ENV || "development";
const staticPath =
  mode === "production" ?
    "`${path.join(process.resourcesPath, 'static')}`" :
    "'static'";

module.exports = {
  mode,
  target: 'electron-renderer',
  devtool: 'cheap-module-source-map',
  entry: './src/renderer/index.tsx',
  output: {
    globalObject: 'this',
    filename: 'renderer-index.js',
    path: path.resolve(__dirname, 'build'),
    publicPath: ''
  },
  optimization: {
    minimize: false,
  },
  module: {
    rules: [
      {
        test: /node_modules[/\\](iconv-lite)[/\\].+/,
        resolve: {
          aliasFields: ['main']
        }
      },
      {
        test: /\.(js|ts|tsx)$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          { loader: "css-loader", options: { sourceMap: true } },
        ],
      },
      {
        test: /\.(png|jpe?g|gif|svg|eot|ttf|woff|woff2)$/,
        use: ['file-loader'],
      }
    ]
  },
  plugins: [
    new webpack.ContextReplacementPlugin(/knex|express/),
    new webpack.DefinePlugin({ '__static': staticPath }),
    new MiniCssExtractPlugin({
        filename: 'css/index.css'
    }),
    new HtmlWebpackPlugin({
      template: 'public/index.html',
    }),
    new PrettierPlugin()
  ],
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  externals: {
    knex: 'commonjs knex',
  }
};