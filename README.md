*Note:* This only works on Webpack 4, if you're still on Webpack 3 or below please use version 1.x

## CDN extension for the HTML Webpack Plugin

[![Build Status](https://travis-ci.org/van-nguyen/webpack-cdn-plugin.svg?branch=master)](https://travis-ci.org/van-nguyen/webpack-cdn-plugin)
[![codecov](https://codecov.io/gh/van-nguyen/webpack-cdn-plugin/branch/master/graph/badge.svg)](https://codecov.io/gh/van-nguyen/webpack-cdn-plugin)

Enhances [html-webpack-plugin](https://github.com/ampedandwired/html-webpack-plugin) functionality by allowing you to specify the modules you want to externalize from node_modules in development and a CDN in production.

Basically this will allow you to greatly reduce build time when developing and improve page load performance on production.

### Installation

It is recommended to run webpack on node 5.x or higher

Install the plugin with npm:

```bash
npm install webpack-cdn-plugin --save-dev
```

or yarn

```bash
yarn add webpack-cdn-plugin --dev
```

### Basic Usage

Require the plugin in your webpack config:

```javascript
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WebpackCdnPlugin = require('webpack-cdn-plugin');
```

Add the plugin to your webpack config:

```javascript
module.exports = {
  // ...
  plugins: [
    new HtmlWebpackPlugin(),
    new WebpackCdnPlugin({
      modules: [
        {
          name: 'vue',
          var: 'Vue',
          style: 'dist/vue.css'
        },
        {
          name: 'vue-router'
        }
      ],
      publicPath: '/node_modules'
    })
  ]
  // ...
};
```

This will generate an `index.html` file with something like below:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Webpack App</title>
    <link href="//unpkg.com/vue@2.3.3/dist/vue.css" rel="stylesheet">
  </head>
  <body>
  <script type="text/javascript" src="//unpkg.com/vue@2.3.3/dist/vue.runtime.common.js"></script>
  <script type="text/javascript" src="//unpkg.com/vue-router@2.5.3/dist/vue-router.common.js"></script>
  <script type="text/javascript" src="/assets/app.js"></script>
  </body>
</html>
```

When you set `prod` to `false`, it will output urls using `publicPath`, so you might need to expose it as some sort of static route.

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Webpack App</title>
    <link href="/node_modules/vue/dist/vue.css" rel="stylesheet">
  </head>
  <body>
  <script type="text/javascript" src="/node_modules/vue/dist/vue.runtime.common.js"></script>
  <script type="text/javascript" src="/node_modules/vue-router/dist/vue-router.common.js"></script>
  <script type="text/javascript" src="/assets/app.js"></script>
  </body>
</html>
```

You can also use your own custom html template, please refer to [html-webpack-plugin](https://github.com/ampedandwired/html-webpack-plugin).

Please see the [example](example) folder for a basic working example.

### Configuration

You can pass an object options to WebpackCdnPlugin. Allowed values are as follows:

##### `modules`:`array` or `object`(for multiple pages)

The available options for each module, which is part of an array.
If you want inject cdn for multiple pages, you can config like this:

```js
plugins:[
// ...otherConfig
new HtmlWebpackPlugin({
      title: 'title',
      cdnModule: 'vue',
      favicon: 'path/to/favicon',
      template: 'path/to/template',
      filename: 'filename',
      // other config
 }),
 new HtmlWebpackPlugin({
      title: 'title',
      cdnModule: 'react',
      favicon: 'path/to/favicon',
      template: 'path/to/template',
      filename: 'filename',
      // other config
  }),
 new WebpackCdnPlugin({
   modules: {
      'vue': [
        { name: 'vue', var: 'Vue', path: 'dist/vue.min.js' },
      ],
      'react': [
        { name: 'react', var: 'React', path: `umd/react.${process.env.NODE_ENV}.min.js` },
        { name: 'react-dom', var: 'ReactDOM', path: `umd/react-dom.${process.env.NODE_ENV}.min.js` },
      ]
    }
 })
]
```

The extra `html-webpack-plugin` option `cdnModule` corresponds to the configuration __key__ that you config inside the `webpack-cdn-plugin` modules
- If you do not give `cdnModule` this value, the default is to take the first one
- If you set `cdnModule = false`, it will not inject cdn

More detail to see [#13](https://github.com/van-nguyen/webpack-cdn-plugin/pull/13)

`name`:`string`

The name of the module you want to externalize

`cdn`:`string` (optional)

If the name from the CDN resource is different from npm, you can override with this i.e. `moment` is `moment.js` on cdnjs

`var`:`string` (optional)

A variable that will be assigned to the module in global scope, webpack requires this. If not supplied than it will be the same as the name.

`path`:`string` (optional)

You can specify a path to the main file that will be used, this is useful when you want the minified version for example if main does not point to it.

`style`:`string` (optional)

If the module comes with style sheets, you can also specify it as a path.

`cssOnly`:`boolean` | `false`

If the module is just a css library, you can specify `cssOnly` to `true`, it will ignore path.

`localScript`:`string` (option)

Useful when you wanted to use your own build version of the library for js files

`localStyle`:`string` (option)

Useful when you wanted to use your own build version of the library for css files


##### `prod`:`boolean` | `true`

`prod` flag defaults to `true`, which will output uri using the CDN, when `false` it will use the file from `node_modules` folder locally.

##### `prodUrl`:`string` | `//unpkg.com/:name@:version/:path`

You can specify a custom template url with the following replacement strings:

`:name`: The name of the module e.g. `vue`

`:version`: The version of the module e.g. `1.0.0`

`:path`: The path to the file e.g. `lib/app.min.js`

A common example is you can use cdnjs e.g. `//cdnjs.cloudflare.com/ajax/libs/:name/:version/:path`. If not specified it will fallback to using unpkg.com.

##### `devUrl`:`string` | `/:name/:path`

Similar to `prodUrl`, this option overrides the default template url for when `prod` is `false`

##### `publicPath`:`string` (optional)

Prefixes the assets with this string, if none is provided it will fallback to the one set globally in `webpack.options.output.publicPath`, note that this is always empty when prod is `true` so that it makes use of the CDN location because it is a remote resource.

### Contribution

This is a pretty simple plugin and caters mostly for my needs. However, I have made it as flexible and customizable as possible.

If you happen to find any bugs, do please report it in the [issues](/../../issues) or can help improve the codebase, [pull requests](/../../pulls) are always welcomed.

### Resources

- [Webpack vs Gulp](https://shirotech.com/tutorial/webpack-vs-gulp)
- [Managing your Node.js versions](https://shirotech.com/node-js/managing-your-node-js-versions)

### Contributors

Many thanks to the following contributors:

- [xiaoiver](https://github.com/xiaoiver)
- [QingWei-Li](https://github.com/QingWei-Li)
- [jikkai](https://github.com/jikkai)
- [likun7981](https://github.com/likun7981)
- [kagawagao](https://github.com/kagawagao)
