#!/usr/bin/env node
'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

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

var _eslintPluginBabel = require('eslint-plugin-babel');

var _eslintPluginBabel2 = _interopRequireDefault(_eslintPluginBabel);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

global.__tests__ = new _mocha2.default({
  timeout: 20000,
  reporter: 'mocha-jenkins-reporter',
  reporterOptions: {
    junit_report_name: 'tests',
    junit_report_path: 'reports/tests/report.xml',
    junit_report_stack: 1
  }
});
global.__coverage__ = {};
global.__linting__ = {
  results: [],
  errorCount: 0,
  warningCount: 0
};

var cli = new _eslint.CLIEngine({
  ignore: true,
  useEslintrc: true
});

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
  collector.add(__coverage__);
  collector.files().forEach(function (file) {
    var file_coverage = collector.fileCoverageFor(file);
  });
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

var transformer = function transformer(content, filename) {
  if (filename.indexOf('node_modules') !== -1) {
    return content;
  }

  var code = _fs2.default.readFileSync(filename).toString();
  _utils.babel_opts.filename = filename;

  var key = _utils.cache.hash(code);

  var lint = {};
  try {
    lint = _utils.cache.get(key + '.lint');
  } catch (err) {
    var results = _eslint.linter.verify(code, _utils.eslint_opts, filename);

    var _results$reduce = results.reduce(function (agg, result) {
      agg[result.severity - 1]++;
      return agg;
    }, [0, 0]);

    var _results$reduce2 = _slicedToArray(_results$reduce, 2);

    var errors = _results$reduce2[0];
    var warnings = _results$reduce2[1];

    lint = { errors: errors, warnings: warnings, results: results };
    _utils.cache.put(key + '.lint', lint);
  }

  __linting__.results.push({
    filePath: filename,
    messages: lint.results,
    errorCount: lint.errors,
    warningCount: lint.warnings
  });

  __linting__.errorCount += lint.errors;
  __linting__.warningCount += lint.warnings;

  var transpiled = null;
  try {
    transpiled = _utils.cache.get(key + '.transpiled');
  } catch (err) {
    transpiled = (0, _babelCore.transform)(code, _utils.babel_opts).code;
    _utils.cache.put(key + '.transpiled', transpiled);
  }

  return transpiled;
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
if (is_directory(entry)) {
  var files = (0, _shelljs.find)(entry).filter(function (arg) {
    return (/\.js$/.test(arg)
    );
  }).sort();
  files.forEach(function (file) {
    console.log('Adding test file:', file);
    __tests__.addFile(file);
  });
  __tests__.run();
} else {
  require(process.argv[2]);
}