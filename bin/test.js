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

var _shelljs = require('shelljs');

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _jsYaml = require('js-yaml');

var _jsYaml2 = _interopRequireDefault(_jsYaml);

var _utils = require('./utils');

var _istanbul = require('istanbul');

var _babelCore = require('babel-core');

var _eslint = require('eslint');

var _mocha = require('mocha');

var _mocha2 = _interopRequireDefault(_mocha);

var _junitViewer = require('junit-viewer');

var _junitViewer2 = _interopRequireDefault(_junitViewer);

var _babelPolyfill = require('babel-polyfill');

var _babelPolyfill2 = _interopRequireDefault(_babelPolyfill);

var _sourceMapSupport = require('source-map-support');

var _sourceMapSupport2 = _interopRequireDefault(_sourceMapSupport);

var _eslintPluginBabel = require('eslint-plugin-babel');

var _eslintPluginBabel2 = _interopRequireDefault(_eslintPluginBabel);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var sourcemap_cache = {};

_sourceMapSupport2.default.install({
  environment: 'node',
  retrieveSourceMap: function retrieveSourceMap(source) {
    _utils.log.debug('Checking sourcemap for source: ' + source);
    var sourcemap = sourcemap_cache[source];
    if (!sourcemap) {
      return null;
    }
    _utils.log.debug('Retrieving sourcemap ' + sourcemap);

    return {
      url: source,
      map: _utils.cache.get(sourcemap)
    };
  }
});

global.__tests__ = new _mocha2.default(_utils.mocha_opts);
global.__coverage__ = {};
global.__linting__ = {
  results: [],
  errorCount: 0,
  warningCount: 0
};

var cli = new _eslint.CLIEngine(_extends({
  ignore: true,
  useEslintrc: true,
  cache: false
}, _utils.eslint_opts));

cli.addPlugin('eslint-plugin-babel', _eslintPluginBabel2.default);

_utils.babel_opts.plugins.push('__coverage__');

process.on('beforeExit', function () {
  _mkdirp2.default.sync('reports/coverage');
  _mkdirp2.default.sync('reports/style');
  _mkdirp2.default.sync('reports/tests');

  var formatter = cli.getFormatter();
  console.log(formatter(__linting__.results));

  var html_formatter = cli.getFormatter('html');
  _fs2.default.writeFileSync('reports/style/index.html', html_formatter(__linting__.results));

  var collector = new _istanbul.Collector();
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = Object.keys(__coverage__)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var key = _step.value;

      if (key.indexOf('node_modules') !== -1) {
        delete __coverage__[key];
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  collector.add(__coverage__);
  //collector.files().forEach(file => {
  //  let file_coverage = collector.fileCoverageFor(file);
  //});

  var final_coverage = collector.getFinalCoverage();

  var reporter = new _istanbul.Reporter(false, 'reports/coverage');
  reporter.add('lcov');
  reporter.add('text');
  reporter.add('text-summary');
  reporter.add('json');
  reporter.add('cobertura');
  reporter.write(collector, true, function () {});

  _fs2.default.writeFileSync('reports/tests/index.html', _junitViewer2.default.junit_viewer('reports/tests'));
  process.exit(0);
});

var image_exts = ['svg', 'png', 'jpg', 'gif'];

var transformer = function transformer(content, filename) {
  _utils.log.debug('Processing file: ' + filename);
  if (filename.endsWith('.css') || filename.endsWith('.scss')) {
    _utils.log.debug('Skipping style file: ' + filename);
    return '';
  }

  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = image_exts[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var image_ext = _step2.value;

      if (filename.endsWith(image_ext)) {
        _utils.log.debug('Skipping image file: ' + filename);
        return '';
      }
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  if (filename.endsWith('.yaml')) {
    _utils.log.debug('Transforming yaml file: ' + filename);
    return 'module.exports = ' + JSON.stringify(_jsYaml2.default.load(content));
  }

  if (filename.endsWith('.txt') || filename.endsWith('.key') || filename.endsWith('.crt') || filename.endsWith('.pem')) {
    _utils.log.debug('Transforming raw file: ' + filename);
    return 'module.exports = ' + JSON.stringify(content.toString());
  }

  if (filename.endsWith('.json')) {
    _utils.log.debug('Loading json file: ' + filename);
    return content;
  }

  if (!(0, _utils.standard_transformer_filter)(filename)) {
    _utils.log.debug('Ignoring filtered file: ' + filename);
    return content;
  }
  _utils.log.debug('Transforming file: ' + filename);

  var key = _utils.cache.hash(content);

  var lint = {};
  try {
    lint = _utils.cache.get(key + '.lint');
  } catch (err) {
    lint = filename.indexOf('node_modules') !== -1 ? { errorCount: 0, warningCount: 0, results: [] } : cli.executeOnText(content, filename);
    _utils.cache.put(key + '.lint', lint);
  }

  var _lint = lint,
      results = _lint.results,
      warningCount = _lint.warningCount,
      errorCount = _lint.errorCount;

  if (results.length > 0) {
    var _linting__$results;

    (_linting__$results = __linting__.results).push.apply(_linting__$results, _toConsumableArray(results));
    __linting__.errorCount += lint.errorCount;
    __linting__.warningCount += lint.warningCount;
  }

  try {
    sourcemap_cache[filename] = key + '.map';
    var cached = _utils.cache.get(key + '.code');
    _utils.log.debug('Retrieving cached transformed file: ' + (key + '.code'));
    return cached;
  } catch (err) {}

  _utils.babel_opts.filename = filename;

  var transpiled = (0, _babelCore.transform)(content, _extends({}, _utils.babel_opts, { sourceMaps: true }));
  _utils.cache.put(key + '.map', transpiled.map);
  var source_map = _path2.default.resolve(process.cwd(), '.ease_cache', key + '.map');

  var transpiled_code = transpiled.code + '\n//# sourceMappingURL=' + source_map;
  _utils.cache.put(key + '.code', transpiled_code);
  return transpiled_code;
};

(0, _module_patch2.default)(transformer, _utils.standard_resolver);

var is_directory = function is_directory(filename) {
  try {
    return _fs2.default.lstatSync(filename).isDirectory();
  } catch (err) {
    return false;
  }
};

var entry = _path2.default.resolve(process.argv[2]);
var file_filter = process.argv[3] ? new RegExp(process.argv[3]) : /\.js$/;

if (is_directory(entry)) {
  var files = (0, _shelljs.find)(entry).filter(function (arg) {
    return file_filter.test(arg) || arg.indexOf('_hooks.js') > 0;
  }).sort();
  files.forEach(function (file) {
    _utils.log.info('Adding test file:', file);
    __tests__.addFile(file);
  });
  __tests__.run();
} else {
  require(entry);
}