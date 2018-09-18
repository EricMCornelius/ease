#!/usr/bin/env node
"use strict";

var _lodash = _interopRequireDefault(require("lodash"));

var _setpath = _interopRequireDefault(require("./setpath"));

var _webpack = _interopRequireDefault(require("webpack"));

var _path = _interopRequireDefault(require("path"));

var _module_patch = _interopRequireDefault(require("./module_patch"));

var _utils = require("./utils");

var _webpackBundleAnalyzer = require("webpack-bundle-analyzer");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const entry = _path.default.resolve(process.argv[2]);

const pathname = _path.default.resolve(process.argv[3]);

const directory = _path.default.dirname(pathname);

const filename = _path.default.basename(pathname);

const libname = filename.split('.')[0];
(0, _module_patch.default)(_utils.standard_transformer, _utils.standard_resolver);
const {
  hook,
  reload_url,
  port,
  name,
  replacements = [],
  ...rest
} = _utils.webpack_opts;
const analyzer = new _webpackBundleAnalyzer.BundleAnalyzerPlugin({
  analyzerMode: 'static',
  reportFilename: 'report.html',
  openAnalyzer: false,
  logLevel: 'info'
});
const replacement_plugins = replacements.map(([key, value]) => new _webpack.default.NormalModuleReplacementPlugin(key, value));

let webpack_settings = _lodash.default.defaultsDeep(rest, {
  entry,
  devtool: 'cheap-module-source-map',
  output: {
    path: directory,
    filename: filename,
    library: libname,
    libraryTarget: 'commonjs2'
  },
  resolveLoader: {
    modules: [_path.default.resolve(__dirname, '../node_modules')]
  },
  resolve: {
    modules: ['node_modules', process.cwd(), '.']
  },
  externals: [{
    'external': true
  }],
  target: 'node',
  plugins: [new _webpack.default.ProgressPlugin(_utils.formatter), new _webpack.default.DefinePlugin({
    'process.env.NODE_ENV': '"production"'
  }), new _webpack.default.LoaderOptionsPlugin({
    minimize: true,
    debug: false
  }), ...replacement_plugins, new _webpack.default.optimize.ModuleConcatenationPlugin(), analyzer],
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

(0, _webpack.default)(webpack_settings, (err, stats) => {
  if (err) {
    throw err;
  }

  log.info(stats.toString('normal'));
});