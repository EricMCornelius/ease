#!/usr/bin/env node
"use strict";

var _setpath = _interopRequireDefault(require("./setpath"));

var _path = _interopRequireDefault(require("path"));

var _fs = _interopRequireDefault(require("fs"));

var _module2 = _interopRequireDefault(require("module"));

var _module_patch = _interopRequireDefault(require("./module_patch"));

var _utils = require("./utils");

var _jsYaml = _interopRequireDefault(require("js-yaml"));

var _core = require("@babel/core");

var _polyfill = _interopRequireDefault(require("@babel/polyfill"));

var _sourceMapSupport = _interopRequireDefault(require("source-map-support"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const sourcemap_cache = {};

_sourceMapSupport.default.install({
  environment: 'node',

  retrieveSourceMap(source) {
    _utils.log.debug(`Checking sourcemap for source: ${source}`);

    let sourcemap = sourcemap_cache[source];

    if (!sourcemap) {
      return null;
    }

    _utils.log.debug(`Retrieving sourcemap ${sourcemap}`);

    return {
      url: source,
      map: _utils.cache.get(sourcemap)
    };
  }

});

let entry = _path.default.resolve(process.argv[2]);

let transformer = (content, filename) => {
  _utils.log.debug(`Processing file: ${filename}`);

  if (!(0, _utils.standard_transformer_filter)(filename)) {
    _utils.log.debug(`Ignoring filtered file: ${filename}`);

    return content;
  }

  if (filename.endsWith('.css') || filename.endsWith('.scss')) {
    _utils.log.debug(`Skipping style file: ${filename}`);

    return '';
  }

  if (filename.endsWith('.json')) {
    _utils.log.debug(`Loading json file: ${filename}`);

    return content;
  }

  _utils.log.debug(`Transforming file: ${filename}`);

  let key = _utils.cache.hash(content);

  try {
    sourcemap_cache[filename] = key + '.map';

    let cached = _utils.cache.get(key + '.code');

    _utils.log.debug(`Retrieving cached transformed file: ${key + '.code'}`);

    return cached;
  } catch (err) {} // yaml transformation


  if (filename.endsWith('.yaml')) {
    _utils.log.debug(`Transforming yaml file: ${filename}`);

    const transformed = `module.exports = ${JSON.stringify(_jsYaml.default.load(content))}`;

    _utils.cache.put(key + '.code', transformed);

    return transformed;
  } // raw import


  const extensions = ['txt', 'key', 'crt', 'pem', 'ps1', 'sh'];

  if (extensions.some(ext => filename.endsWith(`.${ext}`))) {
    _utils.log.debug(`Transforming raw file: ${filename}`);

    const transformed = `module.exports = ${JSON.stringify(content.toString())}`;

    _utils.cache.put(key + '.code', transformed);

    return transformed;
  }

  _utils.babel_opts.filename = filename;
  let transpiled = (0, _core.transform)(content, { ..._utils.babel_opts,
    sourceMaps: true
  });

  _utils.cache.put(key + '.map', transpiled.map);

  let source_map = _path.default.resolve(process.cwd(), '.ease_cache', key + '.map');

  let transpiled_code = `${transpiled.code}\n//# sourceMappingURL=${source_map}`;

  _utils.cache.put(key + '.code', transpiled_code);

  return transpiled_code;
};

(0, _module_patch.default)(transformer, _utils.standard_resolver);

require(entry);