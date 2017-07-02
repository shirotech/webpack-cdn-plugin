const fs = require('fs');
const path = require('path');

const empty = '';
const slash = '/';
const node_modules = module.paths.find(p => fs.existsSync(p));
const packageJson = 'package.json';
const paramsRegex = /:([a-z]+)/gi;

class WebpackCdnPlugin {

  constructor({
                modules, prod = true,
                prodUrl = '//unpkg.com/:name@:version/:path',
                devUrl = ':name/:path', publicPath
  }) {
    this.modules = modules;
    this.prod = prod;
    this.prefix = publicPath;
    this.url = prod ? prodUrl : devUrl;
  }

  apply(compiler) {
    const output = compiler.options.output;
    output.publicPath = output.publicPath || '/';

    if (!this.prod && output.publicPath.slice(-1) !== slash) {
      output.publicPath += slash;
    }

    this.prefix = this.prod ? empty : this.prefix || output.publicPath;

    if (!this.prod && this.prefix.slice(-1) !== slash) {
      this.prefix += slash;
    }

    const getArgs = [this.modules, this.url, this.prefix, this.prod];

    compiler.plugin('compilation', (compilation) => {
      compilation.plugin('html-webpack-plugin-before-html-generation', (data, callback) => {
        data.assets.js = WebpackCdnPlugin._getJs(...getArgs).concat(data.assets.js);
        data.assets.css = WebpackCdnPlugin._getCss(...getArgs).concat(data.assets.css);
        callback(null, data);
      });
    });

    const externals = compiler.options.externals || {};
    this.modules.forEach((p) => {
      externals[p.name] = p.var || p.name;
    });

    compiler.options.externals = externals;
  }

  static _getVersion(name) {
    return require(path.join(node_modules, name, packageJson)).version;
  }

  static _getCss(modules, url, prefix = empty, prod = false) {
    return modules.filter((p) => p.style).map((p) => {
      p.version = WebpackCdnPlugin._getVersion(p.name);
      p.path = p.style;

      return prefix + url.replace(paramsRegex, (m, p1) => {
        if (prod && p.cdn && p1 === 'name') {
          return p.cdn;
        }

        return p[p1];
      });
    });
  }

  static _getJs(modules, url, prefix = empty, prod = false) {
    return modules.map((p) => {
      p.version = WebpackCdnPlugin._getVersion(p.name);
      p.path = p.path || require.resolve(p.name).split(`/node_modules/${p.name}/`).pop();

      return prefix + url.replace(paramsRegex, (m, p1) => {
        if (prod && p.cdn && p1 === 'name') {
          return p.cdn;
        }

        return p[p1];
      });
    });
  }

}

WebpackCdnPlugin.node_modules = node_modules;

module.exports = WebpackCdnPlugin;