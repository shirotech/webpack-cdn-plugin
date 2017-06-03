const fs = require('fs');
const path = require('path');

const node_modules = module.paths.find(p => fs.existsSync(p));
const packageJson = 'package.json';
const paramsRegex = /:([a-z]+)/gi;

class WebpackCdnPlugin {

  constructor({
                modules, prod = true,
                prodUrl = '//unpkg.com/:name@:version/:path',
                devUrl = '/:name/:path', publicPath
  }) {
    this.modules = modules;
    this.prefix = prod ? '' : publicPath || '';
    this.url = prod ? prodUrl : devUrl;
  }

  apply(compiler) {
    this.prefix = compiler.options.publicPath || this.prefix;
    const getArgs = [this.modules, this.url, this.prefix];

    compiler.plugin('compilation', (compilation) => {
      compilation.plugin('html-webpack-plugin-before-html-generation', (data, callback) => {
        data.assets.css = WebpackCdnPlugin._getCss(...getArgs).concat(data.assets.css);
        data.assets.js = WebpackCdnPlugin._getJs(...getArgs).concat(data.assets.js);
        callback(null, data);
      });
    });

    const externals = compiler.options.externals || {};
    this.modules.forEach((p) => {
      externals[p.name] = p.var || p.name;
    });

    compiler.options.externals = externals;
  }

  static _getCss(modules, url, prefix = '') {
    return modules.filter((p) => p.style).map((p) => {
      p.version = p.version || require(path.join(node_modules, p.name, packageJson)).version;
      p.path = p.style;
      return prefix + url.replace(paramsRegex, (m, p1) => p[p1]);
    });
  }

  static _getJs(modules, url, prefix = '') {
    return modules.map((p) => {
      p.version = p.version || require(path.join(node_modules, p.name, packageJson)).version;
      p.path = require.resolve(p.name).split(`/node_modules/${p.name}/`).pop();
      return prefix + url.replace(paramsRegex, (m, p1) => p[p1]);
    });
  }

}

WebpackCdnPlugin.node_modules = node_modules;

module.exports = WebpackCdnPlugin;