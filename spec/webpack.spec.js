const MemoryFS = require('memory-fs');
const webpack = require('webpack');

const fs = new MemoryFS();
const config = require('../example/webpack.config');
config.plugins[1].modules[0].style = 'style.css';
config.plugins[1].modules[1].style = 'style.css';

const compiler = webpack(config);
compiler.outputFileSystem = fs;

const cssMatcher = /<link href="(.+?)" rel="stylesheet">/g;
const jsMatcher = /<script type="text\/javascript" src="(.+?)">/g;

describe('Webpack Integration', () => {

  const cssAssets = [], jsAssets = [];

  beforeAll((done) => {
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
  });

  it('output the right assets', () => {
    expect(cssAssets).toEqual([
      '/node_modules/istanbul/style.css',
      '/node_modules/jasmine/style.css'
    ]);

    expect(jsAssets).toEqual([
      '/node_modules/istanbul/index.js',
      '/node_modules/jasmine/lib/jasmine.js',
      '/assets/app.js'
    ]);
  })

});