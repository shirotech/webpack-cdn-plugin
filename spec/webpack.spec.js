const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WebpackCdnPlugin = require('../');

const cssMatcher = /<link href="(.+?)" rel="stylesheet">/g;
const jsMatcher = /<script type="text\/javascript" src="(.+?)">/g;

let cssAssets;
let jsAssets;

const versions = {
  jasmine: WebpackCdnPlugin.getVersion('jasmine'),
  jasmineSpecReporter: WebpackCdnPlugin.getVersion('jasmine-spec-reporter'),
  istanbul: WebpackCdnPlugin.getVersion('istanbul'),
};

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

function getConfig({ prod, publicPath = '/node_modules', publicPath2 = '/assets', prodUrl }) {
  const output = {
    path: path.join(__dirname, 'dist/assets'),
    filename: 'app.js',
  };

  if (publicPath2) {
    output.publicPath = publicPath2;
  }

  const options = {
    modules: [
      { name: 'jasmine-spec-reporter', path: 'index.js' },
      { name: 'istanbul', style: 'style.css' },
      { name: 'jasmine', cdn: 'jasmine2', style: 'style.css' },
    ],
    prod,
    prodUrl,
  };

  if (publicPath) {
    options.publicPath = publicPath;
  }

  return {
    entry: path.join(__dirname, '../example/app.js'),
    output,
    plugins: [
      new HtmlWebpackPlugin({ filename: '../index.html' }),
      new WebpackCdnPlugin(options),
    ],
  };
}


describe('Webpack Integration', () => {
  describe('When `prod` is true', () => {
    describe('When `prodUrl` is default', () => {
      beforeAll((done) => {
        runWebpack(done, getConfig({ prod: true }));
      });

      it('should output the right assets (css)', () => {
        expect(cssAssets).toEqual([
          `//unpkg.com/istanbul@${versions.istanbul}/style.css`,
          `//unpkg.com/jasmine2@${versions.jasmine}/style.css`,
        ]);
      });

      it('should output the right assets (js)', () => {
        expect(jsAssets).toEqual([
          `//unpkg.com/jasmine-spec-reporter@${versions.jasmineSpecReporter}/index.js`,
          `//unpkg.com/istanbul@${versions.istanbul}/index.js`,
          `//unpkg.com/jasmine2@${versions.jasmine}/lib/jasmine.js`,
          '/assets/app.js',
        ]);
      });
    });

    describe('When `prodUrl` is set', () => {
      beforeAll((done) => {
        runWebpack(done, getConfig({ prod: true, prodUrl: '//cdnjs.cloudflare.com/ajax/libs/:name/:version/:path' }));
      });

      it('should output the right assets (css)', () => {
        expect(cssAssets).toEqual([
          `//cdnjs.cloudflare.com/ajax/libs/istanbul/${versions.istanbul}/style.css`,
          `//cdnjs.cloudflare.com/ajax/libs/jasmine2/${versions.jasmine}/style.css`,
        ]);
      });

      it('should output the right assets (js)', () => {
        expect(jsAssets).toEqual([
          `//cdnjs.cloudflare.com/ajax/libs/jasmine-spec-reporter/${versions.jasmineSpecReporter}/index.js`,
          `//cdnjs.cloudflare.com/ajax/libs/istanbul/${versions.istanbul}/index.js`,
          `//cdnjs.cloudflare.com/ajax/libs/jasmine2/${versions.jasmine}/lib/jasmine.js`,
          '/assets/app.js',
        ]);
      });
    });
  });

  describe('When `prod` is false', () => {
    describe('When `publicPath` is default', () => {
      beforeAll((done) => {
        runWebpack(done, getConfig({ prod: false, publicPath: null, publicPath2: null }));
      });

      it('should output the right assets (css)', () => {
        expect(cssAssets).toEqual([
          '/istanbul/style.css',
          '/jasmine/style.css',
        ]);
      });

      it('should output the right assets (js)', () => {
        expect(jsAssets).toEqual([
          '/jasmine-spec-reporter/index.js',
          '/istanbul/index.js',
          '/jasmine/lib/jasmine.js',
          '/app.js',
        ]);
      });
    });

    describe('When `publicPath` is `/`', () => {
      beforeAll((done) => {
        runWebpack(done, getConfig({ prod: false, publicPath: null, publicPath2: '/' }));
      });

      it('should output the right assets (css)', () => {
        expect(cssAssets).toEqual([
          '/istanbul/style.css',
          '/jasmine/style.css',
        ]);
      });

      it('should output the right assets (js)', () => {
        expect(jsAssets).toEqual([
          '/jasmine-spec-reporter/index.js',
          '/istanbul/index.js',
          '/jasmine/lib/jasmine.js',
          '/app.js',
        ]);
      });
    });

    describe('When `publicPath` is set', () => {
      beforeAll((done) => {
        runWebpack(done, getConfig({ prod: false }));
      });

      it('should output the right assets (css)', () => {
        expect(cssAssets).toEqual([
          '/node_modules/istanbul/style.css',
          '/node_modules/jasmine/style.css',
        ]);
      });

      it('should output the right assets (js)', () => {
        expect(jsAssets).toEqual([
          '/node_modules/jasmine-spec-reporter/index.js',
          '/node_modules/istanbul/index.js',
          '/node_modules/jasmine/lib/jasmine.js',
          '/assets/app.js',
        ]);
      });
    });
  });
});
