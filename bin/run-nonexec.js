'use strict';

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _module2 = require('module');

var _module3 = _interopRequireDefault(_module2);

var _external = require('./external');

var _external2 = _interopRequireDefault(_external);

var _module_patch = require('./module_patch');

var _module_patch2 = _interopRequireDefault(_module_patch);

var _babelCore = require('babel-core');

var _babelPolyfill = require('babel-polyfill');

var _babelPolyfill2 = _interopRequireDefault(_babelPolyfill);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

global.__rootpath__ = process.cwd();
process.env.NODE_PATH = __rootpath__ + ':' + __dirname;
_module3.default.Module._initPaths();

var opts = {
  babelrc: false,
  presets: ['es2015', 'react', 'stage-2'],
  plugins: ['syntax-decorators', 'transform-decorators-legacy', '__coverage__']
};

var transformer = function transformer(content, filename) {
  if (filename.indexOf('node_modules') !== -1) {
    if (filename.indexOf('node_modules/datastore') === -1) {
      return content;
    }
  }

  var code = _fs2.default.readFileSync(filename).toString();
  opts.filename = filename;

  var transpiled = (0, _babelCore.transform)(code, opts);
  return transpiled.code;
};

var resolver = function resolver(request, parent) {
  return request.startsWith('babel-preset') || request.startsWith('babel-plugin') ? _path2.default.resolve(__dirname, '../node_modules/', request) : request;
};

(0, _module_patch2.default)(transformer, resolver);

var entry = _path2.default.resolve(process.argv[2]);
(0, _external2.default)(process.argv[2]);