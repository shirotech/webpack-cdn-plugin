const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const WebpackCdnPlugin = require('../');

module.exports = {
  entry: path.join(__dirname, '../example/app.js'),
  output: {
    path: path.join(__dirname, 'dist/assets'),
    publicPath: '/assets',
    filename: 'app.js'
  },
  plugins: [
    new HtmlWebpackPlugin({ filename: '../index.html' }), // output file relative to output.path
    new WebpackCdnPlugin({
      modules: [
        { name: 'istanbul', style: 'style.css' },
        { name: 'jasmine', style: 'style.css' }
      ],
      prod: true,
      publicPath: '/node_modules' // override when prod is false
    })
  ]
};