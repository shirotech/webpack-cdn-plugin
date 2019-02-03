const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WebpackCdnPlugin = require('../');

const mode = process.env.NODE_ENV || 'development';

module.exports = {
  entry: path.join(__dirname, 'app.js'),
  mode,
  output: {
    path: path.join(__dirname, 'dist/assets'),
    publicPath: '/assets',
    filename: 'app.js',
  },
  plugins: [
    new HtmlWebpackPlugin({ filename: '../index.html' }), // output file relative to output.path
    new WebpackCdnPlugin({
      modules: [
        { name: 'archy' },
        { name: 'jasmine' },
      ],
      prod: mode === 'production',
      publicPath: '/node_modules', // override when prod is false
    }),
  ],
};
