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

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var entry = _path2.default.resolve(process.argv[2]);
var pathname = _path2.default.resolve(process.argv[3]);
var directory = _path2.default.dirname(pathname);
var filename = _path2.default.basename(pathname);
var libname = filename.split('.')[0];

(0, _module_patch2.default)(_utils.standard_transformer, _utils.standard_resolver);

var webpack_settings = _lodash2.default.defaultsDeep(_utils.webpack_opts, {
  entry: [_path2.default.resolve(__dirname, '../node_modules', 'babel-polyfill/dist/polyfill.min.js'), entry],
  devtool: 'cheap-module-source-map',
  output: {
    path: directory,
    filename: filename
  },
  resolveLoader: {
    modules: [_path2.default.resolve(__dirname, '../node_modules')]
  },
  resolve: {
    modules: ['node_modules', 'bower_components']
  },
  externals: [{
    'external': true,
    'regenerator': true
  }],
  target: 'web',
  plugins: [new _webpack2.default.ProgressPlugin(_utils.formatter), new _webpack2.default.DefinePlugin({
    'process.env.NODE_ENV': '"production"'
  }), new _webpack2.default.optimize.DedupePlugin(), new _webpack2.default.optimize.UglifyJsPlugin()],
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
      test: /\.(eot|woff|woff2|ttf|svg|png|jpg|gif)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      loader: 'url-loader?limit=30000&name=[name]-[hash].[ext]'
    }, {
      enforce: 'post',
      test: /\.s?css$/,
      use: ['style-loader', { loader: 'css-loader', options: { modules: true, importLoaders: 1 } }, { loader: 'postcss-loader', options: { plugins: function (_plugins) {
            function plugins() {
              return _plugins.apply(this, arguments);
            }

            plugins.toString = function () {
              return _plugins.toString();
            };

            return plugins;
          }(function () {
            return [].concat(_toConsumableArray(plugins));
          }) } }, 'sass-loader']
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
      test: /\.txt$|\.pem$|\.crt$|\.key$/,
      loaders: ['raw-loader']
    }]
  }
});

webpack_settings.hook && webpack_settings.hook(webpack_settings);
delete webpack_settings.hook;

(0, _webpack2.default)(webpack_settings, function (err, stats) {
  if (err) {
    throw err;
  }

  console.log(stats.toString('normal'));
});