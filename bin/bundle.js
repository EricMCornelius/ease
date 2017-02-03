#!/usr/bin/env node


'use strict';

var _setpath = require('./setpath');

var _setpath2 = _interopRequireDefault(_setpath);

var _webpack = require('webpack');

var _webpack2 = _interopRequireDefault(_webpack);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _module_patch = require('./module_patch');

var _module_patch2 = _interopRequireDefault(_module_patch);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

var entry = _path2.default.resolve(process.argv[2]);
var pathname = _path2.default.resolve(process.argv[3]);
var directory = _path2.default.dirname(pathname);
var filename = _path2.default.basename(pathname);
var libname = filename.split('.')[0];

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

var transformer = function transformer(content, filename) {
  return content;
};

var resolver = function resolver(request, parent) {
  return request.startsWith('babel-preset') || request.startsWith('babel-plugin') ? _path2.default.resolve(__dirname, '../node_modules/', request) : request;
};

(0, _module_patch2.default)(transformer, resolver);

(0, _webpack2.default)({
  entry: entry,
  devtool: 'cheap-module-source-map',
  output: {
    path: directory,
    filename: filename,
    publicPath: '/dist'
    /*
    library: libname,
    libraryTarget: 'commonjs2'
    */
  },
  resolveLoader: {
    root: _path2.default.resolve(__dirname, '../node_modules')
  },
  externals: [{
    'external': true,
    'regenerator': true
  }],
  // target: 'node',
  plugins: [new _webpack2.default.ProgressPlugin(formatter), new _webpack2.default.DefinePlugin({
    'process.env.NODE_ENV': '"production"'
  }), new _webpack2.default.optimize.DedupePlugin(), new _webpack2.default.optimize.UglifyJsPlugin()],
  module: {
    loaders: [{
      test: /\.jsx?$/,
      exclude: /(node_modules|bower_components)/,
      loader: 'babel',
      query: babel_opts
    }, {
      test: /\.s?css$/,
      loaders: ['style', 'css', 'sass']
    }, {
      test: /\.json$/,
      loaders: ['json']
    }, {
      test: /\.yaml$/,
      loaders: ['json', 'yaml']
    }, {
      test: /\.txt$/,
      loaders: ['raw']
    }]
  }
}, function (err, stats) {
  if (err) {
    throw err;
  }

  console.log(stats.toString('normal'));
});