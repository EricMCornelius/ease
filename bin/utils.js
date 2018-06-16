'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.log = exports.cache = exports.standard_resolver = exports.standard_transformer_filter = exports.standard_transformer = exports.webpack_opts = exports.mocha_opts = exports.eslint_opts = exports.babel_opts = exports.formatter = undefined;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _logger = require('logger');

var _logger2 = _interopRequireDefault(_logger);

var _shelljs = require('shelljs');

var _cache = require('./cache');

var _cache2 = _interopRequireDefault(_cache);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

const log = new _logger2.default({ level: 'info' });

global.log = log;

const cache_dir = _path2.default.resolve('.ease_cache');

const get_cache = () => new _cache2.default({ dir: cache_dir });

const get_packages = dir => (0, _shelljs.find)(dir).filter(file => /package\.json$/.test(file));

const get_ease_deps = dir => get_packages(dir).reduce((agg, file) => {
  const dir = _path2.default.dirname(file);
  const dep = _path2.default.basename(dir);
  if (dep.indexOf('webpack') === -1 && dep.indexOf('babel') === -1 && dep.indexOf('source-map-support') === -1) {
    return agg;
  }
  agg[dep] = dir;
  return agg;
}, {});

const ease_dep_dir = _path2.default.resolve(__dirname, '../node_modules');

const cache = get_cache();

let ease_deps = null;
try {
  ease_deps = cache.get('.ease_deps');
} catch (err) {
  ease_deps = get_ease_deps(ease_dep_dir);
  cache.put('.ease_deps', ease_deps);
}

let project_package = '';
try {
  project_package = _fs2.default.readFileSync('package.json');
} catch (err) {}

let project_dep_trie = null;
const project_deps_key = `${cache.hash(project_package)}.deps`;
try {
  project_dep_trie = cache.get(project_deps_key);
} catch (err) {
  project_dep_trie = get_packages(process.cwd()).map(dep => dep.split('/')).reduce((agg, parts) => _lodash2.default.set(agg, parts, {}), {});
  cache.put(project_deps_key, project_dep_trie);
}

const matching_prefixes_impl = (node, path, curr = [], results = []) => {
  if (path.length === 0) {
    return results;
  }

  const next = path.shift();
  const lookup = node[next];
  curr = curr.concat(next);

  return lookup ? matching_prefixes_impl(lookup, path, curr, lookup['package.json'] ? results.concat(curr.join('/')) : results) : results;
};

const matching_prefixes = path => matching_prefixes_impl(project_dep_trie, path.split('/')).reverse();

const formatter = (percentage, message) => {
  const formatted = `${(100.0 * percentage).toFixed(1)}%: ${message}`;
  if (_lodash2.default.isFunction(process.stdout.clearLine)) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(formatted);
  } else {
    log.info(formatted);
  }
};

let babel_opts = {};
const babel_default_opts = {
  babelrc: false,
  presets: ['env', 'react', 'stage-2'],
  plugins: ['syntax-decorators', 'transform-decorators-legacy', 'transform-export-extensions']
};

let mocha_opts = {};
const mocha_default_opts = {
  timeout: 20000,
  reporter: 'mocha-jenkins-reporter',
  reporterOptions: {
    junit_report_name: 'tests',
    junit_report_path: 'reports/tests/report.xml',
    junit_report_stack: 1
  }
};

let eslint_opts = {};

let eslint_default_opts = {
  'env': {
    'node': true
  },
  parserOptions: {
    ecmaVersion: 8,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
      experimentalObjectRestSpread: true
    }
  },
  'extends': 'eslint:recommended',
  'rules': {
    'strict': 0,
    'semi': [2, 'always'],
    'semi-spacing': [2, { 'before': false, 'after': true }],
    'arrow-spacing': [2, { 'before': true, 'after': true }],
    'key-spacing': [2, { 'beforeColon': false, 'afterColon': true }],
    'keyword-spacing': [2, { 'before': true, 'after': true, 'overrides': { 'catch': { 'after': false } } }],
    'max-depth': [2, { max: 4 }],
    'max-nested-callbacks': [2, { max: 3 }],
    'quote-props': [2, 'as-needed'],
    'no-trailing-spaces': [2, { 'skipBlankLines': true }],
    'no-var': 2,
    'arrow-body-style': [2, 'as-needed'],
    'arrow-parens': [2, 'as-needed'],
    'constructor-super': 2,
    'no-console': 2,
    'no-debugger': 2,
    'no-empty': 2,
    'no-extra-parens': 2,
    'no-extra-semi': 2,
    'no-control-regex': 2,
    'no-empty-character-class': 2,
    'no-ex-assign': 2,
    'no-constant-condition': 2,
    'no-class-assign': 2,
    'no-cond-assign': 2,
    'no-const-assign': 2,
    'no-dupe-class-members': 2,
    'no-dupe-args': 2,
    'no-dupe-keys': 2,
    'no-duplicate-case': 2,
    'comma-dangle': [2, 'never'],
    'no-useless-constructor': 2,
    'no-this-before-super': 2,
    'no-duplicate-imports': 2,
    'object-shorthand': [2, 'always'],
    'prefer-arrow-callback': 2,
    'prefer-template': 2,
    'prefer-spread': 2,
    'prefer-const': 2,
    'prefer-rest-params': 2,
    'quotes': [2, 'single'],
    'indent': [2, 2, { 'SwitchCase': 1 }],
    'brace-style': [2, 'stroustrup', { 'allowSingleLine': true }],
    'camelcase': 0
  }
};

// set the default opts to the .eslintrc contents if they exist, otherwise use ease defaults
try {
  const root_eslint_file = _path2.default.resolve(process.cwd(), '.eslintrc');
  eslint_default_opts = JSON.parse(_fs2.default.readFileSync(root_eslint_file));
} catch (err) {}

let webpack_opts = {};
let webpack_default_opts = {};

// set the default opts to the webpack.config.js
try {
  const webpack_file = _path2.default.resolve(process.cwd(), 'webpack.config.js');
  if (_fs2.default.existsSync(webpack_file)) {
    webpack_default_opts = require(webpack_file);
  }
} catch (err) {
  log.error(err.stack);
}

let standard_transformer = (content, filename) => content;

let standard_transformer_filter = filename => filename.indexOf('node_modules') === -1;

let standard_resolver = (request, parent) => {
  log.debug(`Resolving ${request} in ${parent.id}`);

  if (ease_deps[request]) return { request: ease_deps[request] };
  if (!parent.id.startsWith(process.cwd())) return { request, parent };

  const prefixes = matching_prefixes(parent.id);
  parent.paths = prefixes.concat(parent.paths);
  return {
    parent,
    request
  };
};

let config = {};

// merge config from the .ease_config file
try {
  const config_file = _path2.default.resolve(process.cwd(), process.env.EASE_CONFIG || '.ease_config');
  const config = require(config_file);
  _lodash2.default.defaultsDeep(eslint_opts, config.eslint, eslint_default_opts);
  _lodash2.default.defaultsDeep(mocha_opts, config.mocha, mocha_default_opts);
  _lodash2.default.defaultsDeep(webpack_opts, config.webpack, webpack_default_opts);

  const _ref = config.babel || {},
        { override = false, targets } = _ref,
        config_babel_opts = _objectWithoutProperties(_ref, ['override', 'targets']);
  if (override) {
    exports.babel_opts = babel_opts = config_babel_opts;
  } else if (targets) {
    // if targets are provided, set up babel env preset

    const plugins = config_babel_opts.plugins || [];
    const presets = config_babel_opts.presets || [];

    exports.babel_opts = babel_opts = {
      presets: [['env', { targets, debug: true }], ...presets.filter(name => name !== 'env')],
      plugins
    };
  } else {
    _lodash2.default.defaultsDeep(babel_opts, config.babel, babel_default_opts);
  }

  if (config.transform_filter) {
    exports.standard_transformer_filter = standard_transformer_filter = config.transform_filter;
  }

  if (config.log_level) {
    log.level = config.log_level;
  }
} catch (err) {
  log.error(err.stack);
  exports.eslint_opts = eslint_opts = eslint_default_opts;
  exports.babel_opts = babel_opts = babel_default_opts;
}

exports.formatter = formatter;
exports.babel_opts = babel_opts;
exports.eslint_opts = eslint_opts;
exports.mocha_opts = mocha_opts;
exports.webpack_opts = webpack_opts;
exports.standard_transformer = standard_transformer;
exports.standard_transformer_filter = standard_transformer_filter;
exports.standard_resolver = standard_resolver;
exports.cache = cache;
exports.log = log;