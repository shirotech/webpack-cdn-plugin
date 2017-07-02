var fs = require('fs');
var path = require('path');

var empty = '';
var slash = '/';
var node_modules = module.paths.find(function (p) { return fs.existsSync(p); });
var packageJson = 'package.json';
var paramsRegex = /:([a-z]+)/gi;

var WebpackCdnPlugin = function WebpackCdnPlugin(ref) {
  var modules = ref.modules;
  var prod = ref.prod; if ( prod === void 0 ) prod = true;
  var prodUrl = ref.prodUrl; if ( prodUrl === void 0 ) prodUrl = '//unpkg.com/:name@:version/:path';
  var devUrl = ref.devUrl; if ( devUrl === void 0 ) devUrl = ':name/:path';
  var publicPath = ref.publicPath;

  this.modules = modules;
  this.prod = prod;
  this.prefix = publicPath;
  this.url = prod ? prodUrl : devUrl;
};

WebpackCdnPlugin.prototype.apply = function apply (compiler) {
  var output = compiler.options.output;
  output.publicPath = output.publicPath || '/';

  if (!this.prod && output.publicPath.slice(-1) !== slash) {
    output.publicPath += slash;
  }

  this.prefix = this.prod ? empty : this.prefix || output.publicPath;

  if (!this.prod && this.prefix.slice(-1) !== slash) {
    this.prefix += slash;
  }

  var getArgs = [this.modules, this.url, this.prefix];

  compiler.plugin('compilation', function (compilation) {
    compilation.plugin('html-webpack-plugin-before-html-generation', function (data, callback) {
      data.assets.js = WebpackCdnPlugin._getJs.apply(WebpackCdnPlugin, getArgs).concat(data.assets.js);
      data.assets.css = WebpackCdnPlugin._getCss.apply(WebpackCdnPlugin, getArgs).concat(data.assets.css);
      callback(null, data);
    });
  });

  var externals = compiler.options.externals || {};
  this.modules.forEach(function (p) {
    externals[p.name] = p.var || p.name;
  });

  compiler.options.externals = externals;
};

WebpackCdnPlugin._getVersion = function _getVersion (name) {
  return require(path.join(node_modules, name, packageJson)).version;
};

WebpackCdnPlugin._getCss = function _getCss (modules, url, prefix) {
    if ( prefix === void 0 ) prefix = empty;

  return modules.filter(function (p) { return p.style; }).map(function (p) {
    p.version = WebpackCdnPlugin._getVersion(p.name);
    p.path = p.style;
    return prefix + url.replace(paramsRegex, function (m, p1) { return p[p1]; });
  });
};

WebpackCdnPlugin._getJs = function _getJs (modules, url, prefix) {
    if ( prefix === void 0 ) prefix = empty;

  return modules.map(function (p) {
    p.version = WebpackCdnPlugin._getVersion(p.name);
    p.path = p.path || require.resolve(p.name).split(("/node_modules/" + (p.name) + "/")).pop();
    return prefix + url.replace(paramsRegex, function (m, p1) { return p[p1]; });
  });
};

WebpackCdnPlugin.node_modules = node_modules;

module.exports = WebpackCdnPlugin;