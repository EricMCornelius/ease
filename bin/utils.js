'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.standard_resolver = exports.standard_transformer = exports.eslint_opts = exports.babel_opts = exports.formatter = undefined;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _shelljs = require('shelljs');

var _builtins = require('builtins');

var _builtins2 = _interopRequireDefault(_builtins);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ignored = _builtins2.default.reduce(function (agg, key) {
  agg[key] = true;return agg;
}, {});
ignored.test = true;

var resolved_from_ease = [/babel\-/, /webpack/];

var deps = (0, _shelljs.find)(_path2.default.resolve(__dirname, '../node_modules')).filter(function (file) {
  return (/package\.json$/.test(file)
  );
}).reduce(function (agg, file) {
  var dir = _path2.default.dirname(file);
  var dep = _path2.default.basename(dir);
  if (dep.indexOf('webpack') === -1 && dep.indexOf('babel') === -1) {
    return agg;
  }
  if (ignored[dep]) return agg;
  agg[dep] = dir;
  return agg;
}, {});

var formatter = function formatter(percentage, message) {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write((100.0 * percentage).toFixed(1) + '%: ' + message);
};

var babel_opts = {
  babelrc: false,
  presets: ['es2015', 'react', 'stage-2'],
  plugins: ['syntax-decorators', 'transform-decorators-legacy']
};

var eslint_opts = {
  'parser': 'babel-eslint',
  'env': {
    'node': true
  },
  'rules': {
    'strict': 0,
    'semi': [2, 'always'],
    'semi-spacing': [2, { 'before': false, 'after': true }],
    'no-trailing-spaces': [2, { 'skipBlankLines': true }],
    'no-var': 2,
    'arrow-body-style': [2, 'as-needed'],
    'babel/arrow-parens': [2, 'as-needed'],
    'constructor-super': 2,
    'no-arrow-condition': 2,
    'no-class-assign': 2,
    'no-const-assign': 2,
    'no-dupe-class-members': 2,
    'no-this-before-super': 2,
    'object-shorthand': [2, 'always'],
    'prefer-arrow-callback': 2,
    'prefer-template': 2,
    'prefer-spread': 2,
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

var standard_resolver = function standard_resolver(request, parent) {
  return deps[request] ? deps[request] : request;
};

exports.formatter = formatter;
exports.babel_opts = babel_opts;
exports.eslint_opts = eslint_opts;
exports.standard_transformer = standard_transformer;
exports.standard_resolver = standard_resolver;