import path from 'path';

const empty = '';
const slash = '/';
const packageJson = 'package.json';
const paramsRegex = /:([a-z]+)/gi;

class WebpackCdnPlugin {
  constructor({
    modules, prod,
    prodUrl = '//unpkg.com/:name@:version/:path',
    devUrl = ':name/:path', publicPath,
  }) {
    this.modules = modules;
    this.prod = prod !== false;
    this.prefix = publicPath;
    this.url = this.prod ? prodUrl : devUrl;
  }

  apply(compiler) {
    const { output } = compiler.options;
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

  static getVersion(name) {
    return require(path.join(WebpackCdnPlugin.node_modules, name, packageJson)).version;
  }

  static _getCss(modules, url, prefix, prod) {
    prefix = prefix || empty;
    prod = prod !== false;

    return modules.filter(p => p.style).map((p) => {
      p.version = WebpackCdnPlugin.getVersion(p.name);

      return prefix + url.replace(paramsRegex, (m, p1) => {
        if (prod && p.cdn && p1 === 'name') {
          return p.cdn;
        }

        return p[p1 === 'path' ? 'style' : p1];
      });
    });
  }

  static _getJs(modules, url, prefix, prod) {
    prefix = prefix || empty;
    prod = prod !== false;

    return modules.filter(p => !p.cssOnly).map((p) => {
      p.version = WebpackCdnPlugin.getVersion(p.name);
      p.path = p.path || require.resolve(p.name).match(/[\\/]node_modules[\\/].+?[\\/](.*)/)[1].replace(/\\/g, '/');

      return prefix + url.replace(paramsRegex, (m, p1) => {
        if (prod && p.cdn && p1 === 'name') {
          return p.cdn;
        }

        return p[p1];
      });
    });
  }
}

WebpackCdnPlugin.node_modules = path.join(__dirname, '..');

export default WebpackCdnPlugin;
