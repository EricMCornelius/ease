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

var _precss = require('precss');

var _precss2 = _interopRequireDefault(_precss);

var _autoprefixer = require('autoprefixer');

var _autoprefixer2 = _interopRequireDefault(_autoprefixer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var entry = _path2.default.resolve(process.argv[2]);
var pathname = _path2.default.resolve(process.argv[3]);
var directory = _path2.default.dirname(pathname);
var filename = _path2.default.basename(pathname);
var libname = filename.split('.')[0];

(0, _module_patch2.default)(_utils.standard_transformer, _utils.standard_resolver);

(0, _webpack2.default)(_lodash2.default.defaultsDeep(_utils.webpack_opts, {
  entry: [_path2.default.resolve(__dirname, '../node_modules', 'babel-polyfill/dist/polyfill.min.js'), entry],
  devtool: 'cheap-module-source-map',
  output: {
    path: directory,
    filename: filename
  },
  resolveLoader: {
    root: _path2.default.resolve(__dirname, '../node_modules')
  },
  resolve: {
    moduleDirectories: ['node_modules', 'bower_components']
  },
  externals: [{
    'external': true,
    'regenerator': true
  }],
  target: 'web',
  plugins: [new _webpack2.default.ProgressPlugin(_utils.formatter), new _webpack2.default.DefinePlugin({
    'process.env.NODE_ENV': '"production"'
  }), new _webpack2.default.optimize.DedupePlugin(), new _webpack2.default.optimize.UglifyJsPlugin()],
  postcss: function postcss() {
    return [_autoprefixer2.default];
  },

  module: {
    preLoaders: [{
      test: /\.jsx?$/,
      loader: 'shebang'
    }],
    loaders: [{
      test: /\.jsx?$/,
      include: _utils.standard_transformer_filter,
      loader: 'babel',
      query: _utils.babel_opts
    }, {
      test: /\.svg$/,
      loader: 'svg-url-loader'
    }, {
      test: /\.png$/,
      loader: 'url-loader?mimetype=image/png'
    }, {
      test: /\.jpg$/,
      loader: 'url-loader?mimetype=image/jpg'
    }, {
      test: /\.gif$/,
      loader: 'url-loader?mimetype=image/gif'
    }, {
      test: /\.s?css$/,
      loaders: ['style', 'css', 'postcss', 'sass']
    }, {
      test: /\.json$/,
      loaders: ['json']
    }, {
      test: /\.yaml$/,
      loaders: ['json', 'yaml']
    }, {
      test: /\.txt$|\.pem$|\.crt$|\.key$/,
      loaders: ['raw']
    }]
  }
}), function (err, stats) {
  if (err) {
    throw err;
  }

  console.log(stats.toString('normal'));
});