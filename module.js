import path from 'path';

const empty = '';
const slash = '/';
const packageJson = 'package.json';
const paramsRegex = /:([a-z]+)/gi;
const DEFAULT_MODULE_KEY = 'defaultCdnModuleKey____';

class WebpackCdnPlugin {
  constructor({
    modules,
    prod,
    prodUrl = 'https://unpkg.com/:name@:version/:path',
    devUrl = ':name/:path',
    publicPath,
    optimize = false,
  }) {
    this.modules = Array.isArray(modules) ? { [DEFAULT_MODULE_KEY]: modules } : modules;
    this.prod = prod !== false;
    this.prefix = publicPath;
    this.url = this.prod ? prodUrl : devUrl;
    this.optimize = optimize;
  }

  apply(compiler) {
    const { output } = compiler.options;
    output.publicPath = output.publicPath || '/';

    if (output.publicPath.slice(-1) !== slash) {
      output.publicPath += slash;
    }

    this.prefix = this.prod ? empty : this.prefix || output.publicPath;

    if (!this.prod && this.prefix.slice(-1) !== slash) {
      this.prefix += slash;
    }

    const getArgs = [this.url, this.prefix, this.prod, output.publicPath];

    compiler.hooks.compilation.tap('WebpackCdnPlugin', (compilation) => {
      compilation.hooks.htmlWebpackPluginBeforeHtmlGeneration.tapAsync('WebpackCdnPlugin', (data, callback) => {
        const moduleId = data.plugin.options.cdnModule;
        if (moduleId !== false) {
          let modules = this.modules[moduleId || Reflect.ownKeys(this.modules)[0]];
          if (modules) {
            if (this.optimize) {
              const usedModules = WebpackCdnPlugin._getUsedModules(compilation);
              modules = modules.filter(p => usedModules[p.name]);
            }

            WebpackCdnPlugin._cleanModules(modules);
            data.assets.js = WebpackCdnPlugin._getJs(modules, ...getArgs).concat(data.assets.js);
            data.assets.css = WebpackCdnPlugin._getCss(modules, ...getArgs).concat(data.assets.css);
          }
        }
        callback(null, data);
      });
    });
    const externals = compiler.options.externals || {};

    Reflect.ownKeys(this.modules).forEach((key) => {
      const mods = this.modules[key];
      mods.forEach((p) => {
        externals[p.name] = p.var || p.name;
      });
    });

    compiler.options.externals = externals;
  }

  /**
   * Returns the version of a package
   */
  static getVersion(name) {
    try {
      return require(path.join(WebpackCdnPlugin.node_modules, name, packageJson)).version;
    } catch(e) {}
  }

  /**
   * Returns the list of all modules in the bundle
   */
  static _getUsedModules(compilation) {
    let usedModules = {};

    compilation.getStats().toJson().chunks.forEach(c => {
      c.modules.forEach(m => {
        m.reasons.forEach(r => {
          usedModules[r.userRequest] = true;
        });
      });
    });

    return usedModules;
  }

  /**
   * - populate the "version" property of each module
   * - construct the "paths" and "styles" arrays
   * - add a default path if none provided
   */
  static _cleanModules(modules) {
    modules.forEach(p => {
      p.version = WebpackCdnPlugin.getVersion(p.name);

      if (!p.paths) {
        p.paths = [];
      }
      if (p.path) {
        p.paths.unshift(p.path);
        p.path = undefined;
      }
      if (p.paths.length === 0 && !p.cssOnly) {
        p.paths.push(require.resolve(p.name).match(/[\\/]node_modules[\\/].+?[\\/](.*)/)[1].replace(/\\/g, '/'));
      }

      if (!p.styles) {
        p.styles = [];
      }
      if (p.style) {
        p.styles.unshift(p.style);
        p.style = undefined;
      }
    });
  }

  /**
   * Returns the list of CSS files for all modules
   * It is the concatenation of "localStyle" and all "styles"
   */
  static _getCss(modules, url, prefix, prod, publicPath) {
    return WebpackCdnPlugin._get(modules, url, prefix, prod, publicPath, 'styles', 'localStyle');
  }

  /**
   * Returns the list of JS files for all modules
   * It is the concatenation of "localScript" and all "paths"
   */
  static _getJs(modules, url, prefix, prod, publicPath) {
    return WebpackCdnPlugin._get(modules, url, prefix, prod, publicPath, 'paths', 'localScript');
  }

  /**
   * Generic method to construct the list of files
   */
  static _get(modules, url, prefix, prod, publicPath, pathsKey, localKey) {
    prefix = prefix || empty;
    prod = prod !== false;

    let files = [];

    modules.filter(p => p[localKey])
      .forEach(p => files.push(publicPath + p[localKey]));

    modules.filter(p => p[pathsKey].length > 0)
      .forEach(p => {
        p[pathsKey].forEach(s => files.push(
          prefix + url.replace(paramsRegex, (m, p1) => {
            if (prod && p.cdn && p1 === 'name') {
              return p.cdn;
            }

            return p1 === 'path' ? s : p[p1];
          })
        ))
      });

    return files;
  }
}

WebpackCdnPlugin.node_modules = path.join(__dirname, '..');

export default WebpackCdnPlugin;
