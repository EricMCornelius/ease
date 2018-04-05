#!/usr/bin/env node
'use strict';

var _setpath = require('./setpath');

var _setpath2 = _interopRequireDefault(_setpath);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _webpack = require('webpack');

var _webpack2 = _interopRequireDefault(_webpack);

var _webpackServe = require('webpack-serve');

var _webpackServe2 = _interopRequireDefault(_webpackServe);

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

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

const entry = _path2.default.resolve(process.argv[2]);
const output = process.argv[3];

const pathname = _path2.default.resolve(output || 'dist/bundle.js');
const directory = output ? _path2.default.dirname(pathname) : '/dist';
const filename = output ? _path2.default.basename(pathname) : 'bundle';

(0, _module_patch2.default)(_utils.standard_transformer, _utils.standard_resolver);

let { build_dir, host = 'localhost', port = 8888, public_path = directory, hook, name = filename, type } = _utils.webpack_opts,
    rest = _objectWithoutProperties(_utils.webpack_opts, ['build_dir', 'host', 'port', 'public_path', 'hook', 'name', 'type']);

const resolve = val => _path2.default.resolve(__dirname, '../node_modules', val);

// add hot loader plugin to babel
_utils.babel_opts.plugins = (_utils.babel_opts.plugins || []).concat('react-hot-loader/babel');

let webpack_settings = _lodash2.default.defaultsDeep(rest, {
  entry: {
    [name]: entry
  },
  output: {
    path: directory,
    filename: '[name].js',
    publicPath: public_path
  },
  devtool: 'cheap-module-inline-source-map',
  resolveLoader: {
    modules: [_path2.default.resolve(__dirname, '../node_modules')]
  },
  resolve: {
    modules: ['node_modules', 'bower_components', process.cwd()]
  },
  externals: [{
    'external': true,
    'regenerator': true
  }],
  plugins: [new _webpack2.default.ProgressPlugin(_utils.formatter), new _webpack2.default.DefinePlugin({
    'process.env.NODE_ENV': '"dev"'
  }), new _webpack2.default.HotModuleReplacementPlugin()
  // new DashboardPlugin()
  ],
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
      test: /\.worker\.jsx?$/,
      loader: 'worker-loader',
      query: {
        inline: true,
        name: '[name].js'
      }
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
      use: ['style-loader', 'css-loader', 'sass-loader']
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
      test: /\.txt$/,
      loaders: ['raw-loader']
    }]
  },
  server: {
    publicPath: public_path,
    hot: true,
    historyApiFallback: true,
    host,
    port
  }
});

if (hook) {
  const res = hook(webpack_settings, 'run-web');
  if (res) {
    webpack_settings = res;
  }
}

const { server } = webpack_settings,
      webpack_config = _objectWithoutProperties(webpack_settings, ['server']);

webpack_config.watch = true;

(0, _webpackServe2.default)(Object.assign({ config: webpack_config }, server));