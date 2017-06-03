const WebpackCdnPlugin = require('../');

describe('WebpackCdnPlugin', () => {

  let cdn, modules;

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

    describe('When prod is true', () => {

      beforeEach(() => {
        cdn = new WebpackCdnPlugin({modules, prod: true});
      });

      it('initialises', () => {
        expect(cdn.modules).toBe(modules);
        expect(cdn.prefix).toBe('');
        expect(cdn.url).toBe('//unpkg.com/:name@:version/:path');
      });

    });

    describe('When prod is false', () => {

      let publicPath;

      describe('When publicPath is set', () => {

        beforeEach(() => {
          publicPath = '/node_modules';
          cdn = new WebpackCdnPlugin({modules, prod: false, publicPath });
        });

        it('initialises', () => {
          expect(cdn.modules).toBe(modules);
          expect(cdn.prefix).toBe(publicPath);
          expect(cdn.url).toBe('/:name/:path');
        });

      });

      describe('When publicPath is false', () => {

        beforeEach(() => {
          publicPath = false;
          cdn = new WebpackCdnPlugin({modules, prod: false, publicPath });
        });

        it('initialises', () => {
          expect(cdn.modules).toBe(modules);
          expect(cdn.prefix).toBe('');
          expect(cdn.url).toBe('/:name/:path');
        });

      });

    });

  });

  describe('apply()', () => {

    let compiler, plugin, data, callback;

    beforeEach(() => {
      data = {
        assets: {
          css: [],
          js: []
        }
      };

      callback = jasmine.createSpy('callback');

      const compilation = jasmine.createSpyObj('compilation', ['plugin']);
      compilation.plugin.and.callFake((name, action) => {
        action(data, callback);
      });

      plugin = jasmine.createSpy('compilerPlugin');
      plugin.and.callFake((name, action) => {
        action(compilation);
      });

      cdn = new WebpackCdnPlugin({modules});
    });

    describe('externals is empty', () => {

      beforeEach(() => {
        compiler = {options: {}, plugin};
        cdn.apply(compiler);
      });

      it('assets', () => {
        expect(data.assets.css.length).toBe(1);
        expect(data.assets.js.length).toBe(2);
        expect(callback).toHaveBeenCalledWith(null, data);
      });

      it('externals', () => {
        expect(compiler.options.externals).toEqual({istanbul: 'istanbul', jasmine: 'jasmine'});
      });

    });

    describe('externals is not empty', () => {

      beforeEach(() => {
        compiler = {options: {externals: {foo: 'bar'}}, plugin};
        cdn.apply(compiler);
      });

      it('assets', () => {
        expect(data.assets.css.length).toBe(1);
        expect(data.assets.js.length).toBe(2);
        expect(callback).toHaveBeenCalledWith(null, data);
      });

      it('externals', () => {
        expect(compiler.options.externals).toEqual({foo: 'bar', istanbul: 'istanbul', jasmine: 'jasmine'});
      });

    });

  });

  describe('js', () => {

    it('node_modules', () => {
      const baseUrl = WebpackCdnPlugin.node_modules;

      expect(WebpackCdnPlugin._getJs(modules, baseUrl + '/:name/:path')).toEqual([
        baseUrl + '/istanbul/index.js',
        baseUrl + '/jasmine/lib/jasmine.js'
      ]);
    });

    it('unpkg.com', () => {
      const baseUrl = '//unpkg.com';

      expect(WebpackCdnPlugin._getJs(modules, baseUrl + '/:name@:version/:path')).toEqual([
        baseUrl + '/istanbul@0.4.5/index.js',
        baseUrl + '/jasmine@2.6.0/lib/jasmine.js'
      ]);
    });

    it('cdnjs.cloudflare.com', () => {
      const baseUrl = '//cdnjs.cloudflare.com/ajax/libs';

      expect(WebpackCdnPlugin._getJs(modules, baseUrl + '/:name/:version/:path')).toEqual([
        baseUrl + '/istanbul/0.4.5/index.js',
        baseUrl + '/jasmine/2.6.0/lib/jasmine.js'
      ]);
    });

  });

  describe('css', () => {

    it('node_modules', () => {
      const baseUrl = WebpackCdnPlugin.node_modules;

      expect(WebpackCdnPlugin._getCss(modules, baseUrl + '/:name/:path')).toEqual([
        baseUrl + '/jasmine/dist/style.min.css'
      ]);
    });

    it('unpkg.com', () => {
      const baseUrl = '//unpkg.com';

      expect(WebpackCdnPlugin._getCss(modules, baseUrl + '/:name@:version/:path')).toEqual([
        baseUrl + '/jasmine@2.6.0/dist/style.min.css'
      ]);
    });

    it('cdnjs.cloudflare.com', () => {
      const baseUrl = '//cdnjs.cloudflare.com/ajax/libs';

      expect(WebpackCdnPlugin._getCss(modules, baseUrl + '/:name/:version/:path')).toEqual([
        baseUrl + '/jasmine/2.6.0/dist/style.min.css'
      ]);
    });

  });

});