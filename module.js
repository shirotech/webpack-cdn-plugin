const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

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
    crossOrigin = false,
    pathToNodeModules = process.cwd(),
  }) {
    this.modules = Array.isArray(modules) ? { [DEFAULT_MODULE_KEY]: modules } : modules;
    this.prod = prod !== false;
    this.prefix = publicPath;
    this.url = this.prod ? prodUrl : devUrl;
    this.optimize = optimize;
    this.crossOrigin = crossOrigin;
    this.pathToNodeModules = pathToNodeModules;
  }

  apply(compiler) {
    const { output } = compiler.options;
    if (this.prefix === empty) {
      output.publicPath = empty;
    } else {
      output.publicPath = output.publicPath || '/';

      if (output.publicPath.slice(-1) !== slash) {
        output.publicPath += slash;
      }

      this.prefix = this.prod ? empty : this.prefix || output.publicPath;

      if (!this.prod && this.prefix.slice(-1) !== slash) {
        this.prefix += slash;
      }
    }

    const getArgs = [this.url, this.prefix, this.prod, output.publicPath];

    compiler.hooks.compilation.tap('WebpackCdnPlugin', (compilation) => {
      let tagGeneration = HtmlWebpackPlugin.getHooks(
        compilation).beforeAssetTagGeneration;
      if (typeof tagGeneration === 'undefined') {
        tagGeneration = HtmlWebpackPlugin.getHooks(
          compilation).htmlWebpackPluginBeforeHtmlGeneration;
      }
      tagGeneration.tapAsync(
        'WebpackCdnPlugin',
        (data, callback) => {
          const moduleId = data.plugin.options.cdnModule;
          if (moduleId !== false) {
            let modules = this.modules[moduleId || Reflect.ownKeys(this.modules)[0]];
            if (modules) {
              if (this.optimize) {
                const usedModules = WebpackCdnPlugin._getUsedModules(compilation);
                modules = modules.filter((p) => usedModules[p.name]);
              }

              WebpackCdnPlugin._cleanModules(modules, this.pathToNodeModules);

              modules = modules.filter((module) => module.version);

              data.assets.js = WebpackCdnPlugin._getJs(modules, ...getArgs).concat(data.assets.js);
              data.assets.css = WebpackCdnPlugin._getCss(modules, ...getArgs).concat(
                data.assets.css,
              );
            }
          }
          callback(null, data);
        },
      );
    });
    const externals = compiler.options.externals || {};

    Reflect.ownKeys(this.modules).forEach((key) => {
      const mods = this.modules[key];
      mods
        .filter((m) => !m.cssOnly)
        .forEach((p) => {
          externals[p.name] = p.var || p.name;
        });
    });

    compiler.options.externals = externals;

    if (this.prod && this.crossOrigin) {
      compiler.hooks.afterPlugins.tap('WebpackCdnPlugin', () => {
        compiler.hooks.thisCompilation.tap('WebpackCdnPlugin', () => {
          compiler.hooks.compilation.tap('HtmlWebpackPluginHooks', (compilation) => {
            compilation.hooks.htmlWebpackPluginAlterAssetTags.tapAsync(
              'WebpackCdnPlugin',
              this.alterAssetTags.bind(this),
            );
          });
        });
      });
    }
  }

  alterAssetTags(pluginArgs, callback) {
    const filterTag = (tag) => {
      const prefix = this.url.split('/:')[0];
      const url = (tag.tagName === 'script' && tag.attributes.src)
        || (tag.tagName === 'link' && tag.attributes.href);
      return url && url.indexOf(prefix) === 0;
    };
    const processTag = (tag) => {
      tag.attributes.crossorigin = this.crossOrigin;
    };
    pluginArgs.head.filter(filterTag).forEach(processTag);
    pluginArgs.body.filter(filterTag).forEach(processTag);
    callback(null, pluginArgs);
  }

  /**
   * Returns the version of a package in the root of the `node_modules` folder.
   *
   * If `pathToNodeModules` param is not provided, the current working directory is used instead.
   * Note that the path should not end with `node_modules`.
   *
   * @param {string} name name of the package whose version to get.
   * @param {string} [pathToNodeModules=process.cwd()]
   */
  static getVersionInNodeModules(name, pathToNodeModules = process.cwd()) {
    try {
      return require(path.join(pathToNodeModules, 'node_modules', name, packageJson)).version;
    } catch (e) {
      /* istanbul ignore next */
      return null;
    }
  }

  /**
   * Returns the list of all modules in the bundle
   */
  static _getUsedModules(compilation) {
    const usedModules = {};

    compilation
      .getStats()
      .toJson()
      .chunks.forEach((c) => {
        c.modules.forEach((m) => {
          m.reasons.forEach((r) => {
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
   *
   * If `pathToNodeModules` param is not provided, the current working directory is used instead.
   * Note that the path should not end with `node_modules`.
   *
   * @param {Array<Object>} modules the modules to clean
   * @param {string} [pathToNodeModules]
   * @private
   */
  static _cleanModules(modules, pathToNodeModules) {
    modules.forEach((p) => {
      p.version = WebpackCdnPlugin.getVersionInNodeModules(p.name, pathToNodeModules);

      if (!p.paths) {
        p.paths = [];
      }
      if (p.path) {
        p.paths.unshift(p.path);
        p.path = undefined;
      }
      if (p.paths.length === 0 && !p.cssOnly) {
        p.paths.push(
          require
            .resolve(p.name)
            .match(/[\\/]node_modules[\\/].+?[\\/](.*)/)[1]
            .replace(/\\/g, '/'),
        );
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

    const files = [];

    modules.filter((p) => p[localKey]).forEach((p) => files.push(publicPath + p[localKey]));

    modules.filter((p) => p[pathsKey].length > 0)
      .forEach((p) => {
        const moduleSpecificUrl = (prod ? p.prodUrl : p.devUrl);
        p[pathsKey].forEach((s) => files.push(
          prefix + (moduleSpecificUrl || url).replace(paramsRegex, (m, p1) => {
            if (prod && p.cdn && p1 === 'name') {
              return p.cdn;
            }

            return p1 === 'path' ? s : p[p1];
          }),
        ));
      });

    return files;
  }
}

module.exports = WebpackCdnPlugin;
