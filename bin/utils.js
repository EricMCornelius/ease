'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.log = exports.cache = exports.standard_resolver = exports.standard_transformer_filter = exports.standard_transformer = exports.eslint_opts = exports.babel_opts = exports.formatter = undefined;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _winston = require('winston');

var _winston2 = _interopRequireDefault(_winston);

var _shelljs = require('shelljs');

var _cache = require('./cache');

var _cache2 = _interopRequireDefault(_cache);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var cache_dir = _path2.default.resolve('.ease_cache');

var get_cache = function get_cache() {
  return new _cache2.default({ dir: cache_dir });
};

var get_deps = function get_deps(dir) {
  return (0, _shelljs.find)(dir).filter(function (file) {
    return (/package\.json$/.test(file)
    );
  }).reduce(function (agg, file) {
    var dir = _path2.default.dirname(file);
    var dep = _path2.default.basename(dir);
    if (dep.indexOf('webpack') === -1 && dep.indexOf('babel') === -1) {
      return agg;
    }
    agg[dep] = dir;
    return agg;
  }, {});
};

var dep_dir = _path2.default.resolve(__dirname, '../node_modules');
var cache = get_cache();

var deps = null;
try {
  deps = cache.get('.deps');
} catch (err) {
  deps = get_deps(dep_dir);
  cache.put('.deps', deps);
}

var formatter = function formatter(percentage, message) {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write((100.0 * percentage).toFixed(1) + '%: ' + message);
};

var babel_opts = {};
var babel_default_opts = {
  babelrc: false,
  presets: ['es2015', 'react', 'stage-2'],
  plugins: ['syntax-decorators', 'transform-decorators-legacy']
};

var eslint_opts = {};
var eslint_default_opts = {
  'parser': 'babel-eslint',
  'env': {
    'node': true
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
    'babel/arrow-parens': [2, 'as-needed'],
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
  },
  'plugins': ['babel']
};

var standard_transformer = function standard_transformer(content, filename) {
  return content;
};

var standard_transformer_filter = function standard_transformer_filter(filename) {
  return filename.indexOf('node_modules') === -1;
};

var standard_resolver = function standard_resolver(request, parent) {
  return deps[request] ? deps[request] : request;
};

var config = {};

try {
  var config_file = _path2.default.resolve(process.cwd(), '.ease_config');
  var _config = require(config_file);
  _lodash2.default.defaultsDeep(eslint_opts, _config.eslint, eslint_default_opts);
  _lodash2.default.defaultsDeep(babel_opts, _config.babel, babel_default_opts);

  if (_config.transform_filter) {
    exports.standard_transformer_filter = standard_transformer_filter = _config.transform_filter;
  }

  if (_config.log_level) {
    _winston2.default.level = _config.log_level;
  }
} catch (err) {
  exports.eslint_opts = eslint_opts = eslint_default_opts;
  exports.babel_opts = babel_opts = babel_default_opts;
}

exports.formatter = formatter;
exports.babel_opts = babel_opts;
exports.eslint_opts = eslint_opts;
exports.standard_transformer = standard_transformer;
exports.standard_transformer_filter = standard_transformer_filter;
exports.standard_resolver = standard_resolver;
exports.cache = cache;
exports.log = _winston2.default;