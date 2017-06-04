const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WebpackCdnPlugin = require('../');

const cssMatcher = /<link href="(.+?)" rel="stylesheet">/g;
const jsMatcher = /<script type="text\/javascript" src="(.+?)">/g;

let cssAssets, jsAssets;

describe('Webpack Integration', () => {

  describe('When prod is true', () => {

    describe('When prodUrl is default', () => {

      beforeAll((done) => {
        runWebpack(done, getConfig({prod: true}));
      });

      it('should output the right assets (css)', () => {
        expect(cssAssets).toEqual([
          '//unpkg.com/istanbul@0.4.5/style.css',
          '//unpkg.com/jasmine@2.6.0/style.css'
        ]);
      });

      it('should output the right assets (js)', () => {
        expect(jsAssets).toEqual([
          '//unpkg.com/istanbul@0.4.5/index.js',
          '//unpkg.com/jasmine@2.6.0/lib/jasmine.js',
          '/assets/app.js'
        ]);
      });

    });

    describe('When prodUrl is set', () => {

      beforeAll((done) => {
        runWebpack(done, getConfig({prod: true, prodUrl: '//cdnjs.cloudflare.com/ajax/libs/:name/:version/:path'}));
      });

      it('should output the right assets (css)', () => {
        expect(cssAssets).toEqual([
          '//cdnjs.cloudflare.com/ajax/libs/istanbul/0.4.5/style.css',
          '//cdnjs.cloudflare.com/ajax/libs/jasmine/2.6.0/style.css'
        ]);
      });

      it('should output the right assets (js)', () => {
        expect(jsAssets).toEqual([
          '//cdnjs.cloudflare.com/ajax/libs/istanbul/0.4.5/index.js',
          '//cdnjs.cloudflare.com/ajax/libs/jasmine/2.6.0/lib/jasmine.js',
          '/assets/app.js'
        ]);
      });

    });

  });

  describe('When prod is false', () => {

    describe('publicPath is default', () => {

      beforeAll((done) => {
        runWebpack(done, getConfig({prod: false, publicPath: null}));
      });

      it('should output the right assets (css)', () => {
        expect(cssAssets).toEqual([
          '/assets/istanbul/style.css',
          '/assets/jasmine/style.css'
        ]);
      });

      it('should output the right assets (js)', () => {
        expect(jsAssets).toEqual([
          '/assets/istanbul/index.js',
          '/assets/jasmine/lib/jasmine.js',
          '/assets/app.js'
        ]);
      });

    });

    describe('publicPath is set', () => {

      beforeAll((done) => {
        runWebpack(done, getConfig({prod: false}));
      });

      it('should output the right assets (css)', () => {
        expect(cssAssets).toEqual([
          '/node_modules/istanbul/style.css',
          '/node_modules/jasmine/style.css'
        ]);
      });

      it('should output the right assets (js)', () => {
        expect(jsAssets).toEqual([
          '/node_modules/istanbul/index.js',
          '/node_modules/jasmine/lib/jasmine.js',
          '/assets/app.js'
        ]);
      });

    });

  });

});

const fs = new webpack.MemoryOutputFileSystem();

function runWebpack(callback, config) {
  cssAssets = [];
  jsAssets = [];

  const compiler = webpack(config);
  compiler.outputFileSystem = fs;

  compiler.run((err, stats) => {
    const html = stats.compilation.assets['../index.html'].source();

    let matches;
    while (matches = cssMatcher.exec(html)) {
      cssAssets.push(matches[1]);
    }

    while (matches = jsMatcher.exec(html)) {
      jsAssets.push(matches[1]);
    }

    callback();
  });
}

function getConfig({prod, publicPath = '/node_modules', prodUrl}) {
  const options = {
    modules: [
      { name: 'istanbul', style: 'style.css' },
      { name: 'jasmine', style: 'style.css' }
    ], prod, prodUrl
  };

  if (publicPath) {
    options.publicPath = publicPath;
  }

  return {
    entry: path.join(__dirname, '../example/app.js'),
    output: {
      path: path.join(__dirname, 'dist/assets'),
      publicPath: '/assets',
      filename: 'app.js'
    },
    plugins: [
      new HtmlWebpackPlugin({ filename: '../index.html' }),
      new WebpackCdnPlugin(options)
    ]
  }
}