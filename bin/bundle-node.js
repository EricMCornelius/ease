#!/usr/bin/env node
'use strict';

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _setpath = require('./setpath');

var _setpath2 = _interopRequireDefault(_setpath);

var _webpack = require('webpack');

var _webpack2 = _interopRequireDefault(_webpack);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _module_patch = require('./module_patch');

var _module_patch2 = _interopRequireDefault(_module_patch);

var _utils = require('./utils');

var _webpackBundleAnalyzer = require('webpack-bundle-analyzer');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

const entry = _path2.default.resolve(process.argv[2]);
const pathname = _path2.default.resolve(process.argv[3]);
const directory = _path2.default.dirname(pathname);
const filename = _path2.default.basename(pathname);
const libname = filename.split('.')[0];

(0, _module_patch2.default)(_utils.standard_transformer, _utils.standard_resolver);

const { hook, reload_url, port, name, replacements = [] } = _utils.webpack_opts,
      rest = _objectWithoutProperties(_utils.webpack_opts, ['hook', 'reload_url', 'port', 'name', 'replacements']);

const analyzer = new _webpackBundleAnalyzer.BundleAnalyzerPlugin({
  analyzerMode: 'static',
  reportFilename: 'report.html',
  openAnalyzer: false,
  logLevel: 'info'
});

const replacement_plugins = replacements.map(([key, value]) => new _webpack2.default.NormalModuleReplacementPlugin(key, value));

let webpack_settings = _lodash2.default.defaultsDeep(rest, {
  entry,
  devtool: 'cheap-module-source-map',
  output: {
    path: directory,
    filename: filename,
    library: libname,
    libraryTarget: 'commonjs2'
  },
  resolveLoader: {
    modules: [_path2.default.resolve(__dirname, '../node_modules')]
  },
  resolve: {
    modules: ['node_modules', process.cwd(), '.']
  },
  externals: [{
    'external': true
  }],
  target: 'node',
  plugins: [new _webpack2.default.ProgressPlugin(_utils.formatter), new _webpack2.default.DefinePlugin({
    'process.env.NODE_ENV': '"production"'
  }), new _webpack2.default.LoaderOptionsPlugin({
    minimize: true,
    debug: false
  }), ...replacement_plugins, new _webpack2.default.optimize.ModuleConcatenationPlugin(), analyzer],
  module: {
    rules: [{
      enforce: 'pre',
      test: /\.jsx?$/,
      loader: 'shebang-loader'
    }, {
      enforce: 'post',
      test: /\.jsx?$/,
      include: _utils.standard_transformer_filter,
      loader: 'babel-loader',
      query: _utils.babel_opts
    }, {
      enforce: 'post',
      test: /\.s?css$/,
      loaders: ['style-loader', 'css-loader', 'sass-loader']
    }, {
      enforce: 'post',
      test: /\.ya?ml$/,
      loaders: ['json-loader', 'yaml-loader']
    }, {
      enforce: 'post',
      test: /\.txt$|\.pem$|\.crt$|\.key$|\.ps1$|\.sh/,
      loaders: ['raw-loader']
    }]
  }
});

if (hook) {
  const res = hook(webpack_settings, 'bundle-node');
  if (res) {
    webpack_settings = res;
  }
}

(0, _webpack2.default)(webpack_settings, (err, stats) => {
  if (err) {
    throw err;
  }

  console.log(stats.toString('normal'));
});