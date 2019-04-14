#!/usr/bin/env node
"use strict";

var _setpath = _interopRequireDefault(require("./setpath"));

var _lodash = require("lodash");

var _url = require("url");

var _webpack = _interopRequireDefault(require("webpack"));

var _webpackDevServer = _interopRequireDefault(require("webpack-dev-server"));

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
  public_path = directory,
  hook,
  name = filename,
  type,
  serve = {},
  ...rest
} = _utils.webpack_opts;
(0, _lodash.defaultsDeep)(serve, {
  host: 'localhost',
  port: 8888
});

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
  plugins: [new _webpack.default.DefinePlugin({
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
  watch: true
});

if (hook) {
  const res = hook(webpack_settings, 'run-web');

  if (res) {
    webpack_settings = res;
  }
}

const config = webpack_settings;
const compiler = (0, _webpack.default)(config);
const {
  host,
  port
} = serve;
const options = {
  hot: true,
  progress: true,
  ...serve
};
const server = new _webpackDevServer.default(compiler, options);
server.listen(port, host);