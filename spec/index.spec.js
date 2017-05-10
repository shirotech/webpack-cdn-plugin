const WebpackCdnPlugin = require('../');

describe('WebpackCdnPlugin', () => {

  let modules;

  beforeEach(() => {
    modules = [
      {
        name: 'istanbul'
      },
      {
        name: 'jasmine',
        style: 'dist/style.min.css'
      }
    ];
  });

  describe('constructor()', () => {

    it('instantiates', () => {
      expect(new WebpackCdnPlugin(modules)).toBeDefined();
    });

  });

  describe('getAssets()', () => {

    it('node_modules', () => {
      const baseUrl = WebpackCdnPlugin.node_modules;

      expect(WebpackCdnPlugin.getAssets(modules, baseUrl + '/:name/:path')).toEqual([
        baseUrl + '/istanbul/index.js',
        baseUrl + '/jasmine/lib/jasmine.js',
        baseUrl + '/jasmine/dist/style.min.css'
      ]);
    });

    it('unpkg.com', () => {
      const baseUrl = '//unpkg.com';

      expect(WebpackCdnPlugin.getAssets(modules, baseUrl + '/:name@:version/:path')).toEqual([
        baseUrl + '/istanbul@0.4.5/index.js',
        baseUrl + '/jasmine@2.6.0/lib/jasmine.js',
        baseUrl + '/jasmine@2.6.0/dist/style.min.css'
      ]);
    });

    it('cdnjs.cloudflare.com', () => {
      const baseUrl = '//cdnjs.cloudflare.com/ajax/libs';

      expect(WebpackCdnPlugin.getAssets(modules, baseUrl + '/:name/:version/:path')).toEqual([
        baseUrl + '/istanbul/0.4.5/index.js',
        baseUrl + '/jasmine/2.6.0/lib/jasmine.js',
        baseUrl + '/jasmine/2.6.0/dist/style.min.css'
      ]);
    });

  });

});