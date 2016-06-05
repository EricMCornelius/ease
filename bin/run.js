#!/usr/bin/env node
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _setpath = require('./setpath');

var _setpath2 = _interopRequireDefault(_setpath);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _module2 = require('module');

var _module3 = _interopRequireDefault(_module2);

var _module_patch = require('./module_patch');

var _module_patch2 = _interopRequireDefault(_module_patch);

var _utils = require('./utils');

var _babelCore = require('babel-core');

var _babelPolyfill = require('babel-polyfill');

var _babelPolyfill2 = _interopRequireDefault(_babelPolyfill);

var _sourceMapSupport = require('source-map-support');

var _sourceMapSupport2 = _interopRequireDefault(_sourceMapSupport);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var sourcemap_cache = {};

_sourceMapSupport2.default.install({
  environment: 'node',
  retrieveSourceMap: function retrieveSourceMap(source) {
    var sourcemap = sourcemap_cache[source];
    if (!sourcemap) {
      return null;
    }
    return {
      url: source,
      map: _utils.cache.get(sourcemap)
    };
  }
});

var entry = _path2.default.resolve(process.argv[2]);

var transformer = function transformer(content, filename) {
  _utils.log.debug('Processing file: ' + filename);
  if (!(0, _utils.standard_transformer_filter)(filename)) {
    return content;
  }

  var key = _utils.cache.hash(content);
  try {
    sourcemap_cache[filename] = key + '.map';
    return _utils.cache.get(key + '.code');
  } catch (err) {
    console.log(err);
  }

  var code = _fs2.default.readFileSync(filename).toString();
  _utils.babel_opts.filename = filename;

  var transpiled = (0, _babelCore.transform)(code, _extends({}, _utils.babel_opts, { sourceMaps: 'both' }));
  _utils.cache.put(key + '.map', transpiled.map);
  var source_map = _path2.default.resolve(process.cwd(), '.ease_cache', key + '.map');
  var transpiled_code = '//# sourceMappingURL=' + source_map + '\n' + transpiled.code;
  _utils.cache.put(key + '.code', transpiled_code);
  return transpiled_code;
};

(0, _module_patch2.default)(transformer, _utils.standard_resolver);

require(entry);