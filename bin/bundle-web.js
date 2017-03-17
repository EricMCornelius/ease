#!/usr/bin/env node
'use strict';

var _ref;

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

var _extractTextWebpackPlugin = require('extract-text-webpack-plugin');

var _extractTextWebpackPlugin2 = _interopRequireDefault(_extractTextWebpackPlugin);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var source = _path2.default.resolve(process.argv[2]);
var target = process.argv[3];

var pathname = _path2.default.resolve(target || '');
var directory = target ? _path2.default.dirname(pathname) : 'dist';
var filename = target ? _path2.default.basename(pathname) : null;

(0, _module_patch2.default)(_utils.standard_transformer, _utils.standard_resolver);

var hook = _utils.webpack_opts.hook,
    reload_url = _utils.webpack_opts.reload_url,
    port = _utils.webpack_opts.port,
    _webpack_opts$name = _utils.webpack_opts.name,
    name = _webpack_opts$name === undefined ? filename : _webpack_opts$name,
    _webpack_opts$vendor = _utils.webpack_opts.vendor,
    vendor = _webpack_opts$vendor === undefined ? [] : _webpack_opts$vendor,
    type = _utils.webpack_opts.type,
    rest = _objectWithoutProperties(_utils.webpack_opts, ['hook', 'reload_url', 'port', 'name', 'vendor', 'type']);

var resolve = function resolve(val) {
  return _path2.default.resolve(__dirname, '../node_modules', val);
};
var polyfill_deps = type === 'lib' ? [] : ['babel-polyfill/dist/polyfill.min.js'].map(resolve);

vendor = [].concat(_toConsumableArray(polyfill_deps), _toConsumableArray(vendor));
if (vendor.length === 1) vendor = vendor[0];

var entry = vendor.length > 0 ? (_ref = {}, _defineProperty(_ref, name, source), _defineProperty(_ref, 'vendor', vendor), _ref) : _defineProperty({}, name, source);

var output = type === 'lib' ? {
  path: directory,
  filename: '[name].js',
  library: name,
  libraryTarget: 'umd'
} : {
  path: directory,
  filename: '[name].js'
};

var webpack_settings = _lodash2.default.defaultsDeep(rest, {
  entry: entry,
  output: output,
  devtool: 'source-map',
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
  }), new _extractTextWebpackPlugin2.default(name ? name + '.css' : '[name].css')].concat(_toConsumableArray(type === 'lib' ? [] : [new _webpack2.default.optimize.CommonsChunkPlugin({ names: ['vendor', 'manifest'] })])),
  module: {
    rules: [{
      enforce: 'pre',
      test: /\.jsx?$/,
      use: 'shebang-loader'
    }, {
      enforce: 'post',
      test: /\.jsx?$/,
      include: _utils.standard_transformer_filter,
      loader: 'babel-loader',
      query: _utils.babel_opts
    }, {
      enforce: 'post',
      test: /\.(eot|woff|woff2|ttf|svg|png|jpg|gif)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      loader: 'url-loader',
      query: {
        limit: 30000,
        name: '[name]-[hash].[ext]'
      }
    }, {
      enforce: 'post',
      test: /\.s?css$/,
      use: _extractTextWebpackPlugin2.default.extract({
        fallback: 'style-loader',
        use: [{
          loader: 'css-loader',
          options: {
            sourceMap: true,
            modules: false
          }
        }, {
          loader: 'postcss-loader',
          options: {
            plugins: function plugins() {
              return [_precss2.default, _autoprefixer2.default];
            }
          }
        }, {
          loader: 'sass-loader'
        }]
      })
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

if (hook) {
  var res = hook(webpack_settings, 'bundle-web');
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