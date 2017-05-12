const fs = require('fs');
const path = require('path');
const HtmlWebpackIncludeAssetsPlugin = require('html-webpack-include-assets-plugin');

const node_modules = module.paths.find(p => fs.existsSync(p));
const packageJson = 'package.json';
const paramsRegex = /:([a-z]+)/gi;

class WebpackCdnPlugin extends HtmlWebpackIncludeAssetsPlugin {

  constructor({
                modules, prod = true,
                prodUrl = '//unpkg.com/:name@:version/:path',
                devUrl = '/node_modules/:name/:path',
                append = false, publicPath = false
  }) {
    const url = prod ? prodUrl : devUrl;
    super({ assets: WebpackCdnPlugin.getAssets(modules, url), append, publicPath });

    this.modules = modules;
    this.url = url;
  }

  apply(compiler) {
    super.apply(compiler);

    const externals = compiler.options.externals || {};
    this.modules.forEach((p) => {
      externals[p.name] = p.var || p.name;
    });

    compiler.options.externals = externals;
  }

  static getAssets(modules, url) {
    return modules.map((p) => {
      p.version = require(path.join(node_modules, p.name, packageJson)).version;
      p.path = p.path || require.resolve(p.name).split(`/node_modules/${p.name}/`).pop();
      return url.replace(paramsRegex, (m, p1) => p[p1]);
    }).concat(modules.filter((p) => p.style).map((p) => {
      p.path = p.style;
      return url.replace(paramsRegex, (m, p1) => p[p1]);
    }));
  }

}

WebpackCdnPlugin.node_modules = node_modules;

module.exports = WebpackCdnPlugin;