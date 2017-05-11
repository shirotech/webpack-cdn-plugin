const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const WebpackCdnPlugin = require('../');

module.exports = {
  entry: path.join(__dirname, 'app.js'),
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'app.js'
  },
  plugins: [
    new HtmlWebpackPlugin(),
    new WebpackCdnPlugin([
      { name: 'istanbul' },
      { name: 'jasmine' }
    ])
  ]
};