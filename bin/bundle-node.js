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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var entry = _path2.default.resolve(process.argv[2]);
var pathname = _path2.default.resolve(process.argv[3]);
var directory = _path2.default.dirname(pathname);
var filename = _path2.default.basename(pathname);
var libname = filename.split('.')[0];

(0, _module_patch2.default)(_utils.standard_transformer, _utils.standard_resolver);

var hook = _utils.webpack_opts.hook,
    reload_url = _utils.webpack_opts.reload_url,
    port = _utils.webpack_opts.port,
    name = _utils.webpack_opts.name,
    rest = _objectWithoutProperties(_utils.webpack_opts, ['hook', 'reload_url', 'port', 'name']);

var webpack_settings = _lodash2.default.defaultsDeep(rest, {
  entry: entry,
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
    modules: ['node_modules', '.']
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
  }), new _webpack2.default.optimize.UglifyJsPlugin({
    beautify: false,
    mangle: {
      screw_ie8: true,
      keep_fnames: true
    },
    compress: {
      screw_ie8: true
    },
    comments: false
  })],
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
      test: /\.json$/,
      loaders: ['json-loader']
    }, {
      enforce: 'post',
      test: /\.yaml$/,
      loaders: ['json-loader', 'yaml-loader']
    }, {
      enforce: 'post',
      test: /\.txt$|\.pem$|\.crt$|\.key$|\.ps1$|\.sh/,
      loaders: ['raw-loader']
    }]
  }
});

if (hook) {
  var res = hook(webpack_settings, 'bundle-node');
  if (res) {
    webpack_settings = res;
  }
}

(0, _webpack2.default)(webpack_settings, function (err, stats) {
  if (err) {
    throw err;
  }

  console.log(stats.toString('normal'));
});