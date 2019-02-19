const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WebpackCdnPlugin = require('../module');

const cssMatcher = /<link href="(.+?)" rel="stylesheet"( crossorigin="anonymous")?>/g;
const jsMatcher = /<script type="text\/javascript" src="(.+?)"( crossorigin="anonymous")?>/g;

let cssAssets;
let jsAssets;
let cssAssets2;
let jsAssets2;
let cssCrossOrigin;
let jsCrossOrigin;
let cssCrossOrigin2;
let jsCrossOrigin2;
let manifestFile;

const versions = {
  jasmine: WebpackCdnPlugin.getVersion('jasmine'),
  jasmineSpecReporter: WebpackCdnPlugin.getVersion('jasmine-spec-reporter'),
  nyc: WebpackCdnPlugin.getVersion('nyc'),
  jasmineCore: WebpackCdnPlugin.getVersion('jasmine-core'),
  archy: WebpackCdnPlugin.getVersion('archy'),
};

const fs = new webpack.MemoryOutputFileSystem();

function runWebpack(callback, config) {
  cssAssets = [];
  jsAssets = [];
  cssAssets2 = [];
  jsAssets2 = [];
  cssCrossOrigin = [];
  jsCrossOrigin = [];
  cssCrossOrigin2 = [];
  jsCrossOrigin2 = [];
  manifestFile = null;

  const compiler = webpack(config);
  compiler.outputFileSystem = fs;

  compiler.run((err, stats) => {
    const html = stats.compilation.assets['../index.html'].source();
    const html2 = stats.compilation.assets['../index2.html'].source();

    let matches;
    while ((matches = cssMatcher.exec(html))) {
      cssAssets.push(matches[1]);
      cssCrossOrigin.push(/crossorigin="anonymous"/.test(matches[2]));
    }
    while ((matches = cssMatcher.exec(html2))) {
      cssAssets2.push(matches[1]);
      cssCrossOrigin2.push(/crossorigin="anonymous"/.test(matches[2]));
    }

    while ((matches = jsMatcher.exec(html))) {
      jsAssets.push(matches[1]);
      jsCrossOrigin.push(/crossorigin="anonymous"/.test(matches[2]));
    }
    while ((matches = jsMatcher.exec(html2))) {
      jsAssets2.push(matches[1]);
      jsCrossOrigin2.push(/crossorigin="anonymous"/.test(matches[2]));
    }
    manifestFile = stats.compilation.assets['cdn-manifest.json'] && JSON.parse(stats.compilation.assets['cdn-manifest.json'].source());
    callback();
  });
}

function getConfig({
  prod,
  publicPath = '/node_modules',
  publicPath2 = '/assets',
  prodUrl,
  moduleProdUrl,
  moduleDevUrl,
  multiple,
  multipleFiles,
  optimize,
  crossOrigin,
  manifest,
}) {
  const output = {
    path: path.join(__dirname, 'dist/assets'),
    filename: 'app.js',
  };

  if (publicPath2) {
    output.publicPath = publicPath2;
  }

  let modules = [
    { name: 'jasmine-spec-reporter', path: 'index.js' },
    {
      name: 'nyc',
      style: 'style.css',
      localStyle: 'local.css',
      localScript: 'local.js',
    },
    { name: 'jasmine', cdn: 'jasmine2', style: 'style.css' },
  ];
  if (moduleProdUrl) {
    modules[2].prodUrl = moduleProdUrl;
  }
  if (moduleDevUrl) {
    modules[2].devUrl = moduleDevUrl;
  }
  if (multiple) {
    modules = {
      module1: modules,
      module2: [
        { name: 'jasmine-core', path: 'index.js' },
        {
          name: 'nyc',
          style: 'style.css',
          localStyle: 'local.css',
          localScript: 'local.js',
        },
        { name: 'archy', cdn: 'archy', style: 'style.css' },
      ],
    };
  }
  if (multipleFiles) {
    modules = [
      {
        name: 'jasmine',
        cdn: 'jasmine2',
        paths: ['index1.js', 'index2.js'],
        styles: ['style1.css', 'style2.css'],
      },
      {
        name: 'archy',
        path: 'index1.js',
        paths: ['index2.js'],
        style: 'style1.css',
        styles: ['style2.css'],
      },
    ];
  }

  const options = {
    modules,
    prod,
    prodUrl,
    optimize,
    crossOrigin,
    manifest,
  };

  if (publicPath) {
    options.publicPath = publicPath;
  }

  return {
    mode: prod ? 'production' : 'development',
    entry: path.join(__dirname, '../example/app.js'),
    output,
    optimization: {
      minimize: false,
    },
    plugins: [
      new HtmlWebpackPlugin({ filename: '../index.html' }),
      new HtmlWebpackPlugin({ filename: '../index2.html', cdnModule: 'module2' }),
      new HtmlWebpackPlugin({ filename: '../index3.html', cdnModule: false }),
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
          '/assets/local.css',
          `https://unpkg.com/nyc@${versions.nyc}/style.css`,
          `https://unpkg.com/jasmine2@${versions.jasmine}/style.css`,
        ]);
      });

      it('should output the right assets (js)', () => {
        expect(jsAssets).toEqual([
          '/assets/local.js',
          `https://unpkg.com/jasmine-spec-reporter@${versions.jasmineSpecReporter}/index.js`,
          `https://unpkg.com/nyc@${versions.nyc}/index.js`,
          `https://unpkg.com/jasmine2@${versions.jasmine}/lib/jasmine.js`,
          '/assets/app.js',
        ]);
      });
    });

    describe('When `prodUrl` is set', () => {
      beforeAll((done) => {
        runWebpack(
          done,
          getConfig({
            prod: true,
            prodUrl: '//cdnjs.cloudflare.com/ajax/libs/:name/:version/:path',
          }),
        );
      });

      it('should output the right assets (css)', () => {
        expect(cssAssets).toEqual([
          '/assets/local.css',
          `//cdnjs.cloudflare.com/ajax/libs/nyc/${versions.nyc}/style.css`,
          `//cdnjs.cloudflare.com/ajax/libs/jasmine2/${versions.jasmine}/style.css`,
        ]);
      });

      it('should output the right assets (js)', () => {
        expect(jsAssets).toEqual([
          '/assets/local.js',
          `//cdnjs.cloudflare.com/ajax/libs/jasmine-spec-reporter/${
            versions.jasmineSpecReporter
          }/index.js`,
          `//cdnjs.cloudflare.com/ajax/libs/nyc/${versions.nyc}/index.js`,
          `//cdnjs.cloudflare.com/ajax/libs/jasmine2/${versions.jasmine}/lib/jasmine.js`,
          '/assets/app.js',
        ]);
      });
    });

    describe('When module `prodUrl` is set', () => {
      beforeAll((done) => {
        runWebpack(
          done,
          getConfig({
            prod: true,
            prodUrl: '//cdnjs.cloudflare.com/ajax/libs/:name/:version/:path',
            moduleProdUrl: '//cdn.jsdelivr.net/npm/:name@:version/:path',
          }),
        );
      });

      it('should output the right assets (css)', () => {
        expect(cssAssets).toEqual([
          '/assets/local.css',
          `//cdnjs.cloudflare.com/ajax/libs/nyc/${versions.nyc}/style.css`,
          `//cdn.jsdelivr.net/npm/jasmine2@${versions.jasmine}/style.css`,
        ]);
      });

      it('should output the right assets (js)', () => {
        expect(jsAssets).toEqual([
          '/assets/local.js',
          `//cdnjs.cloudflare.com/ajax/libs/jasmine-spec-reporter/${
            versions.jasmineSpecReporter
          }/index.js`,
          `//cdnjs.cloudflare.com/ajax/libs/nyc/${versions.nyc}/index.js`,
          `//cdn.jsdelivr.net/npm/jasmine2@${versions.jasmine}/lib/jasmine.js`,
          '/assets/app.js',
        ]);
      });
    });

    describe('When set `multiple` modules', () => {
      beforeAll((done) => {
        runWebpack(
          done,
          getConfig({
            prod: true,
            multiple: true,
          }),
        );
      });

      it('should output the right assets (css)', () => {
        expect(cssAssets).toEqual([
          '/assets/local.css',
          `https://unpkg.com/nyc@${versions.nyc}/style.css`,
          `https://unpkg.com/jasmine2@${versions.jasmine}/style.css`,
        ]);
        expect(cssAssets2).toEqual([
          '/assets/local.css',
          `https://unpkg.com/nyc@${versions.nyc}/style.css`,
          `https://unpkg.com/archy@${versions.archy}/style.css`,
        ]);
      });

      it('should output the right assets (js)', () => {
        expect(jsAssets).toEqual([
          '/assets/local.js',
          `https://unpkg.com/jasmine-spec-reporter@${versions.jasmineSpecReporter}/index.js`,
          `https://unpkg.com/nyc@${versions.nyc}/index.js`,
          `https://unpkg.com/jasmine2@${versions.jasmine}/lib/jasmine.js`,
          '/assets/app.js',
        ]);
        expect(jsAssets2).toEqual([
          '/assets/local.js',
          `https://unpkg.com/jasmine-core@${versions.jasmineCore}/index.js`,
          `https://unpkg.com/nyc@${versions.nyc}/index.js`,
          `https://unpkg.com/archy@${versions.archy}/index.js`,
          '/assets/app.js',
        ]);
      });
    });

    describe('With multiple files', () => {
      beforeAll((done) => {
        runWebpack(
          done,
          getConfig({
            prod: true, publicPath: null, publicPath2: null, multipleFiles: true,
          }),
        );
      });

      it('should output the right assets (css)', () => {
        expect(cssAssets).toEqual([
          `https://unpkg.com/jasmine2@${versions.jasmine}/style1.css`,
          `https://unpkg.com/jasmine2@${versions.jasmine}/style2.css`,
          `https://unpkg.com/archy@${versions.archy}/style1.css`,
          `https://unpkg.com/archy@${versions.archy}/style2.css`,
        ]);
      });

      it('should output the right assets (js)', () => {
        expect(jsAssets).toEqual([
          `https://unpkg.com/jasmine2@${versions.jasmine}/index1.js`,
          `https://unpkg.com/jasmine2@${versions.jasmine}/index2.js`,
          `https://unpkg.com/archy@${versions.archy}/index1.js`,
          `https://unpkg.com/archy@${versions.archy}/index2.js`,
          '/app.js',
        ]);
      });
    });

    describe('When `crossOrigin` is set', () => {
      beforeAll((done) => {
        runWebpack(done, getConfig({ prod: true, crossOrigin: 'anonymous' }));
      });

      it('should output the right assets (css)', () => {
        expect(cssCrossOrigin).toEqual([false, true, true]);
      });

      it('should output the right assets (js)', () => {
        expect(jsCrossOrigin).toEqual([false, true, true, true, false]);
      });
    });

    describe('With `manifest`', () => {
      beforeAll((done) => {
        runWebpack(
          done,
          getConfig({
            prod: true, manifest: true,
          }),
        );
      });

      it('should output the manifest json', () => {
        expect(manifestFile).toEqual(jasmine.any(Object));
      });

      it('should output the manifest with right assets (js)', () => {
        expect(manifestFile.js).toEqual(['/assets/local.js',
          'https://unpkg.com/jasmine-spec-reporter@4.2.1/index.js',
          'https://unpkg.com/nyc@13.3.0/index.js',
          'https://unpkg.com/jasmine2@3.3.1/lib/jasmine.js']);
      });

      it('should output the manifest with right assets (css)', () => {
        expect(manifestFile.css).toEqual(['/assets/local.css',
          'https://unpkg.com/nyc@13.3.0/style.css',
          'https://unpkg.com/jasmine2@3.3.1/style.css']);
      });
    });
  });

  describe('When `prod` is false', () => {
    describe('When `publicPath` is default', () => {
      beforeAll((done) => {
        runWebpack(done, getConfig({ prod: false, publicPath: null, publicPath2: null }));
      });

      it('should output the right assets (css)', () => {
        expect(cssAssets).toEqual(['/local.css', '/nyc/style.css', '/jasmine/style.css']);
      });

      it('should output the right assets (js)', () => {
        expect(jsAssets).toEqual([
          '/local.js',
          '/jasmine-spec-reporter/index.js',
          '/nyc/index.js',
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
        expect(cssAssets).toEqual(['/local.css', '/nyc/style.css', '/jasmine/style.css']);
      });

      it('should output the right assets (js)', () => {
        expect(jsAssets).toEqual([
          '/local.js',
          '/jasmine-spec-reporter/index.js',
          '/nyc/index.js',
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
          '/assets/local.css',
          '/node_modules/nyc/style.css',
          '/node_modules/jasmine/style.css',
        ]);
      });

      it('should output the right assets (js)', () => {
        expect(jsAssets).toEqual([
          '/assets/local.js',
          '/node_modules/jasmine-spec-reporter/index.js',
          '/node_modules/nyc/index.js',
          '/node_modules/jasmine/lib/jasmine.js',
          '/assets/app.js',
        ]);
      });
    });

    describe('When module `devUrl` is set', () => {
      beforeAll((done) => {
        runWebpack(done, getConfig({
          prod: false,
          moduleDevUrl: ':name/dist/:path',
        }));
      });

      it('should output the right assets (css)', () => {
        expect(cssAssets).toEqual([
          '/assets/local.css',
          '/node_modules/nyc/style.css',
          '/node_modules/jasmine/dist/style.css',
        ]);
      });

      it('should output the right assets (js)', () => {
        expect(jsAssets).toEqual([
          '/assets/local.js',
          '/node_modules/jasmine-spec-reporter/index.js',
          '/node_modules/nyc/index.js',
          '/node_modules/jasmine/dist/lib/jasmine.js',
          '/assets/app.js',
        ]);
      });
    });

    describe('When set `multiple` modules', () => {
      beforeAll((done) => {
        runWebpack(
          done,
          getConfig({
            prod: false,
            publicPath: null,
            publicPath2: null,
            multiple: true,
          }),
        );
      });

      it('should output the right assets (css)', () => {
        expect(cssAssets).toEqual(['/local.css', '/nyc/style.css', '/jasmine/style.css']);
        expect(cssAssets2).toEqual(['/local.css', '/nyc/style.css', '/archy/style.css']);
      });

      it('should output the right assets (js)', () => {
        expect(jsAssets).toEqual([
          '/local.js',
          '/jasmine-spec-reporter/index.js',
          '/nyc/index.js',
          '/jasmine/lib/jasmine.js',
          '/app.js',
        ]);
        expect(jsAssets2).toEqual([
          '/local.js',
          '/jasmine-core/index.js',
          '/nyc/index.js',
          '/archy/index.js',
          '/app.js',
        ]);
      });
    });

    describe('With multiple files', () => {
      beforeAll((done) => {
        runWebpack(
          done,
          getConfig({
            prod: false, publicPath: null, publicPath2: null, multipleFiles: true,
          }),
        );
      });

      it('should output the right assets (css)', () => {
        expect(cssAssets).toEqual([
          '/jasmine/style1.css',
          '/jasmine/style2.css',
          '/archy/style1.css',
          '/archy/style2.css',
        ]);
      });

      it('should output the right assets (js)', () => {
        expect(jsAssets).toEqual([
          '/jasmine/index1.js',
          '/jasmine/index2.js',
          '/archy/index1.js',
          '/archy/index2.js',
          '/app.js',
        ]);
      });
    });

    describe('With `optimize`', () => {
      beforeAll((done) => {
        runWebpack(
          done,
          getConfig({
            prod: false, publicPath: null, publicPath2: null, optimize: true,
          }),
        );
      });

      it('should output the right assets (css)', () => {
        expect(cssAssets).toEqual(['/jasmine/style.css']);
      });

      it('should output the right assets (js)', () => {
        expect(jsAssets).toEqual(['/jasmine/lib/jasmine.js', '/app.js']);
      });
    });


    describe('With `manifest`', () => {
      beforeAll((done) => {
        runWebpack(
          done,
          getConfig({
            prod: false, publicPath: null, publicPath2: null, optimize: false, manifest: true,
          }),
        );
      });

      it('should output the manifest json', () => {
        expect(manifestFile).toEqual(jasmine.any(Object));
      });

      it('should output the manifest with right assets (js)', () => {
        expect(manifestFile.js).toEqual(['/local.js',
          '/jasmine-spec-reporter/index.js',
          '/nyc/index.js',
          '/jasmine/lib/jasmine.js']);
      });

      it('should output the manifest with right assets (css)', () => {
        expect(manifestFile.css).toEqual(['/local.css', '/nyc/style.css', '/jasmine/style.css']);
      });
    });
  });
});
