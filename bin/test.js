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

var _istanbulLibCoverage = _interopRequireDefault(require("istanbul-lib-coverage"));

var _istanbulLibSourceMaps = _interopRequireDefault(require("istanbul-lib-source-maps"));

var _istanbulLibReport = _interopRequireDefault(require("istanbul-lib-report"));

var _istanbulReports = _interopRequireDefault(require("istanbul-reports"));

var _core = require("@babel/core");

var _eslint = require("eslint");

var _mocha = _interopRequireDefault(require("mocha"));

var _junitViewer = _interopRequireDefault(require("junit-viewer"));

var _jenkins = _interopRequireDefault(require("./reporters/jenkins"));

var _polyfill = _interopRequireDefault(require("@babel/polyfill"));

var _sourceMapSupport = _interopRequireDefault(require("source-map-support"));

var _anymatch = _interopRequireDefault(require("anymatch"));

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

const init_mocha = opts => {
  const {
    reporter,
    reporterOptions,
    include,
    exclude,
    ...rest
  } = opts;
  const inst = new _mocha.default(rest);
  const excluded = exclude ? (0, _anymatch.default)(exclude) : v => false;
  const included = include ? (0, _anymatch.default)(include) : v => true;
  const reporter_inst = reporter === 'jenkins' ? _jenkins.default : reporter;
  inst.reporter(reporter_inst, reporterOptions);

  const _addfile = inst.addFile.bind(inst);

  inst.addFile = file => {
    if (excluded(file)) {
      _utils.log.info('Skipping excluded test file', file);

      return;
    }

    if (included(file)) {
      _utils.log.info('Adding test file', file);

      _addfile(file);
    }
  };

  return inst;
};

global.__tests__ = init_mocha(_utils.mocha_opts);
global.__coverage__ = global.__coverage__ || {};
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
}); // istanbul plugin configuration
// see https://github.com/istanbuljs/nyc#selecting-files-for-coverage

_utils.babel_opts.plugins.push((0, _utils.resolve_babel_plugin)('istanbul').concat(_utils.coverage_opts));

process.on('beforeExit', () => {
  _mkdirp.default.sync('reports/coverage');

  _mkdirp.default.sync('reports/style');

  _mkdirp.default.sync('reports/tests');

  let formatter = cli.getFormatter();
  console.log(formatter(__linting__.results));
  let html_formatter = cli.getFormatter('html');

  _fs.default.writeFileSync('reports/style/index.html', html_formatter(__linting__.results));

  const source_map_store = _istanbulLibSourceMaps.default.createSourceMapStore();

  const coverage_map = _istanbulLibCoverage.default.createCoverageMap(__coverage__);

  const {
    map,
    sourceFinder
  } = source_map_store.transformCoverage(coverage_map);

  const report_context = _istanbulLibReport.default.createContext({
    dir: 'reports/coverage',
    sourceFinder
  });

  const tree = _istanbulLibReport.default.summarizers.pkg(map);

  const coverageReporters = ['lcov', 'text', 'text-summary', 'json', 'cobertura'];
  coverageReporters.forEach(reporter => {
    tree.visit(_istanbulReports.default.create(reporter, {}), report_context);
  });

  _fs.default.writeFileSync('reports/tests/index.html', _junitViewer.default.junit_viewer('reports/tests'));

  const had_failures = global.__tests__.failures > 0;
  process.exit(had_failures ? 1 : 0);
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
  files.forEach(file => __tests__.addFile(file));
  global.__tests__ = __tests__.run();
} else {
  require(entry);
}