#!/usr/bin/env node
'use strict';

var _entry;

var _setpath = require('./setpath');

var _setpath2 = _interopRequireDefault(_setpath);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _webpack = require('webpack');

var _webpack2 = _interopRequireDefault(_webpack);

var _webpackDevServer = require('webpack-dev-server');

var _webpackDevServer2 = _interopRequireDefault(_webpackDevServer);

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

var _plugin = require('webpack-dashboard/plugin');

var _plugin2 = _interopRequireDefault(_plugin);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var entry = _path2.default.resolve(process.argv[2]);
var output = process.argv[3];

var pathname = _path2.default.resolve(output || 'dist/bundle.js');
var directory = output ? _path2.default.dirname(pathname) : '/dist';
var filename = output ? _path2.default.basename(pathname) : 'bundle';

(0, _module_patch2.default)(_utils.standard_transformer, _utils.standard_resolver);

var build_dir = _utils.webpack_opts.build_dir,
    _webpack_opts$host = _utils.webpack_opts.host,
    host = _webpack_opts$host === undefined ? 'localhost' : _webpack_opts$host,
    _webpack_opts$port = _utils.webpack_opts.port,
    port = _webpack_opts$port === undefined ? 8888 : _webpack_opts$port,
    reload_url = _utils.webpack_opts.reload_url,
    _webpack_opts$public_ = _utils.webpack_opts.public_path,
    public_path = _webpack_opts$public_ === undefined ? directory : _webpack_opts$public_,
    hook = _utils.webpack_opts.hook,
    _webpack_opts$name = _utils.webpack_opts.name,
    name = _webpack_opts$name === undefined ? filename : _webpack_opts$name,
    _webpack_opts$vendor = _utils.webpack_opts.vendor,
    vendor = _webpack_opts$vendor === undefined ? [] : _webpack_opts$vendor,
    type = _utils.webpack_opts.type,
    rest = _objectWithoutProperties(_utils.webpack_opts, ['build_dir', 'host', 'port', 'reload_url', 'public_path', 'hook', 'name', 'vendor', 'type']);

if (port && !reload_url) {
  reload_url = 'http://' + host + ':' + port;
}

var resolve = function resolve(val) {
  return _path2.default.resolve(__dirname, '../node_modules', val);
};

var reload_deps = ['webpack-dev-server/client', 'webpack/hot/only-dev-server'].map(resolve);
reload_deps[0] += '?' + reload_url;

var polyfill_deps = ['babel-polyfill/dist/polyfill.min.js'].map(resolve);

vendor = [].concat(_toConsumableArray(polyfill_deps), _toConsumableArray(vendor));
if (vendor.length === 1) vendor = vendor[0];

var webpack_settings = _lodash2.default.defaultsDeep(rest, {
  entry: (_entry = {}, _defineProperty(_entry, name, [].concat(_toConsumableArray(reload_deps), [entry])), _defineProperty(_entry, 'vendor', vendor), _entry),
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
    modules: ['node_modules', 'bower_components']
  },
  externals: [{
    'external': true,
    'regenerator': true
  }],
  plugins: [new _webpack2.default.ProgressPlugin(_utils.formatter), new _webpack2.default.optimize.CommonsChunkPlugin({
    names: ['vendor', 'manifest']
  }), new _webpack2.default.DefinePlugin({
    'process.env.NODE_ENV': '"dev"'
  }), new _webpack2.default.HotModuleReplacementPlugin(), new _extractTextWebpackPlugin2.default(name ? name + '.css' : '[name].css'), new _plugin2.default()],
  module: {
    rules: [{
      enforce: 'pre',
      test: /\.jsx?$/,
      loader: 'shebang-loader'
    }, {
      enforce: 'pre',
      test: /\.jsx?$/,
      include: _utils.standard_transformer_filter,
      loader: 'react-hot-loader/webpack'
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
      test: /\.txt$/,
      loaders: ['raw-loader']
    }]
  },
  server: {
    publicPath: public_path,
    hot: true,
    historyApiFallback: true,
    host: host,
    port: port
  }
});

if (hook) {
  var res = hook(webpack_settings, 'run-web');
  if (res) {
    webpack_settings = res;
  }
}

var _webpack_settings = webpack_settings,
    server = _webpack_settings.server,
    remainder = _objectWithoutProperties(_webpack_settings, ['server']);

var webpack_config = (0, _webpack2.default)(remainder, function (err, stats) {
  if (err) {
    throw err;
  }

  console.log(stats.toString('normal'));
});

var server_host = server.host,
    server_port = server.port,
    server_config = _objectWithoutProperties(server, ['host', 'port']);

new _webpackDevServer2.default(webpack_config, server_config).listen(server_port, server_host, function (err, result) {
  if (err) {
    return console.error(err);
  }

  console.log('Listening at ' + host + ':' + port);
});