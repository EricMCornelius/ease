#!/usr/bin/env node
"use strict";

var _setpath = _interopRequireDefault(require("./setpath"));

var _lodash = require("lodash");

var _url = require("url");

var _webpack = _interopRequireDefault(require("webpack"));

var _webpackServe = _interopRequireDefault(require("webpack-serve"));

var _path = _interopRequireDefault(require("path"));

var _module_patch = _interopRequireDefault(require("./module_patch"));

var _utils = require("./utils");

var _precss = _interopRequireDefault(require("precss"));

var _autoprefixer = _interopRequireDefault(require("autoprefixer"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const entry = _path.default.resolve(process.argv[2]);

const output = process.argv[3];

const pathname = _path.default.resolve(output || 'dist/bundle.js');

const directory = output ? _path.default.dirname(pathname) : '/dist';
const filename = output ? _path.default.basename(pathname) : 'bundle';
(0, _module_patch.default)(_utils.standard_transformer, _utils.standard_resolver);
let {
  build_dir,
  reload_url = 'ws://localhost:8081',
  backend_url = 'ws://localhost:8081',
  host = 'localhost',
  port = 8888,
  public_path = directory,
  hook,
  name = filename,
  type,
  ...rest
} = _utils.webpack_opts;
const public_websocket = (0, _url.parse)(reload_url);
const private_websocket = (0, _url.parse)(backend_url);
const use_https = public_websocket.protocol === 'wss:';

const resolve = val => _path.default.resolve(__dirname, '../node_modules', val); // add hot loader plugin to babel


_utils.babel_opts.plugins = (_utils.babel_opts.plugins || []).concat('react-hot-loader/babel');
let webpack_settings = (0, _lodash.defaultsDeep)(rest, {
  entry: {
    [name]: entry
  },
  output: {
    path: directory,
    filename: '[name].js',
    publicPath: public_path,
    globalObject: 'this' // TODO: re-evaulate after https://github.com/webpack/webpack/issues/6642 ...

  },
  devtool: 'cheap-module-inline-source-map',
  resolveLoader: {
    modules: [_path.default.resolve(__dirname, '../node_modules')]
  },
  resolve: {
    modules: ['node_modules', 'bower_components', process.cwd()]
  },
  externals: [{
    'external': true,
    'regenerator': true
  }],
  plugins: [new _webpack.default.ProgressPlugin(_utils.formatter), new _webpack.default.DefinePlugin({
    'process.env.NODE_ENV': '"dev"'
  }) // new DashboardPlugin()
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
      test: /\.yaml$/,
      loaders: ['json-loader', 'yaml-loader']
    }, {
      enforce: 'post',
      test: /\.txt$/,
      loaders: ['raw-loader']
    }]
  },
  watch: true,
  serve: {
    host,
    port,
    devMiddleware: {
      publicPath: public_path
    },
    hotClient: {
      https: use_https,
      host: {
        server: private_websocket.hostname,
        client: public_websocket.hostname
      },
      port: {
        server: parseInt(private_websocket.port, 10),
        client: parseInt(public_websocket.port, 10)
      }
    }
  }
});

if (hook) {
  const res = hook(webpack_settings, 'run-web');

  if (res) {
    webpack_settings = res;
  }
}

const config = webpack_settings;
const argv = {};
(0, _webpackServe.default)(argv, {
  config
});