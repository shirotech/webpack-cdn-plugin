const webpack = require('webpack');

const cssMatcher = /<link href="(.+?)" rel="stylesheet">/g;
const jsMatcher = /<script type="text\/javascript" src="(.+?)">/g;

let cssAssets, jsAssets;

describe('Webpack Integration', () => {

  describe('When prod is true', () => {

    beforeAll((done) => {
      runWebpack(done, require('./prod.config.js'));
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

  describe('When prod is false', () => {

    beforeAll((done) => {
      runWebpack(done, require('./dev.config.js'));
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

const fs = new webpack.MemoryOutputFileSystem();

function runWebpack(done, config) {
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

    done();
  });
}