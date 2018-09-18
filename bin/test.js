#!/usr/bin/env node
"use strict";

var _setpath = _interopRequireDefault(require("./setpath"));

var _path = _interopRequireDefault(require("path"));

var _fs = _interopRequireDefault(require("fs"));

var _module2 = _interopRequireDefault(require("module"));

var _module_patch = _interopRequireDefault(require("./module_patch"));

var _shelljs = require("shelljs");

var _mkdirp = _interopRequireDefault(require("mkdirp"));

var _jsYaml = _interopRequireDefault(require("js-yaml"));

var _utils = require("./utils");

var _istanbul = require("istanbul");

var _core = require("@babel/core");

var _eslint = require("eslint");

var _mocha = _interopRequireDefault(require("mocha"));

var _junitViewer = _interopRequireDefault(require("junit-viewer"));

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

global.__tests__ = new _mocha.default(_utils.mocha_opts);
global.__coverage__ = {};
global.__linting__ = {
  results: [],
  errorCount: 0,
  warningCount: 0
};
let cli = new _eslint.CLIEngine({
  ignore: true,
  useEslintrc: true,
  cache: false,
  ..._utils.eslint_opts
});

_utils.babel_opts.plugins.push('istanbul');

process.on('beforeExit', () => {
  _mkdirp.default.sync('reports/coverage');

  _mkdirp.default.sync('reports/style');

  _mkdirp.default.sync('reports/tests');

  let formatter = cli.getFormatter();
  console.log(formatter(__linting__.results));
  let html_formatter = cli.getFormatter('html');

  _fs.default.writeFileSync('reports/style/index.html', html_formatter(__linting__.results));

  let collector = new _istanbul.Collector();

  for (const key of Object.keys(__coverage__)) {
    if (key.indexOf('node_modules') !== -1) {
      delete __coverage__[key];
    }
  }

  collector.add(__coverage__); //collector.files().forEach(file => {
  //  let file_coverage = collector.fileCoverageFor(file);
  //});

  let final_coverage = collector.getFinalCoverage();
  let reporter = new _istanbul.Reporter(false, 'reports/coverage');
  reporter.add('lcov');
  reporter.add('text');
  reporter.add('text-summary');
  reporter.add('json');
  reporter.add('cobertura');
  reporter.write(collector, true, () => {});

  _fs.default.writeFileSync('reports/tests/index.html', _junitViewer.default.junit_viewer('reports/tests'));

  process.exit(0);
});
const image_exts = ['svg', 'png', 'jpg', 'gif'];

let transformer = (content, filename) => {
  _utils.log.debug(`Processing file: ${filename}`);

  if (filename.endsWith('.css') || filename.endsWith('.scss')) {
    _utils.log.debug(`Skipping style file: ${filename}`);

    return '';
  }

  for (const image_ext of image_exts) {
    if (filename.endsWith(image_ext)) {
      _utils.log.debug(`Skipping image file: ${filename}`);

      return '';
    }
  }

  if (filename.endsWith('.yaml')) {
    _utils.log.debug(`Transforming yaml file: ${filename}`);

    return `module.exports = ${JSON.stringify(_jsYaml.default.load(content))}`;
  }

  if (filename.endsWith('.txt') || filename.endsWith('.key') || filename.endsWith('.crt') || filename.endsWith('.pem')) {
    _utils.log.debug(`Transforming raw file: ${filename}`);

    return `module.exports = ${JSON.stringify(content.toString())}`;
  }

  if (filename.endsWith('.json')) {
    _utils.log.debug(`Loading json file: ${filename}`);

    return content;
  }

  if (!(0, _utils.standard_transformer_filter)(filename)) {
    _utils.log.debug(`Ignoring filtered file: ${filename}`);

    return content;
  }

  _utils.log.debug(`Transforming file: ${filename}`);

  let key = _utils.cache.hash(content);

  let lint = {};

  try {
    lint = _utils.cache.get(key + '.lint');
  } catch (err) {
    lint = filename.indexOf('node_modules') !== -1 ? {
      errorCount: 0,
      warningCount: 0,
      results: []
    } : cli.executeOnText(content, filename);

    _utils.cache.put(key + '.lint', lint);
  }

  const {
    results,
    warningCount,
    errorCount
  } = lint;

  if (results.length > 0) {
    __linting__.results.push(...results);

    __linting__.errorCount += lint.errorCount;
    __linting__.warningCount += lint.warningCount;
  }

  try {
    sourcemap_cache[filename] = key + '.map';

    let cached = _utils.cache.get(key + '.code');

    _utils.log.debug(`Retrieving cached transformed file: ${key + '.code'}`);

    return cached;
  } catch (err) {}

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

const is_directory = filename => {
  try {
    return _fs.default.lstatSync(filename).isDirectory();
  } catch (err) {
    return false;
  }
};

let entry = _path.default.resolve(process.argv[2]);

let file_filter = process.argv[3] ? new RegExp(process.argv[3]) : /\.js$/;

if (is_directory(entry)) {
  let files = (0, _shelljs.find)(entry).filter(arg => file_filter.test(arg) || arg.indexOf('_hooks.js') > 0).sort();
  files.forEach(file => {
    _utils.log.info('Adding test file:', file);

    __tests__.addFile(file);
  });

  __tests__.run();
} else {
  require(entry);
}