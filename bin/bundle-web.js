#!/usr/bin/env node
"use strict";

var _lodash = _interopRequireDefault(require("lodash"));

var _setpath = _interopRequireDefault(require("./setpath"));

var _webpack = _interopRequireDefault(require("webpack"));

var _path = _interopRequireDefault(require("path"));

var _module_patch = _interopRequireDefault(require("./module_patch"));

var _utils = require("./utils");

var _precss = _interopRequireDefault(require("precss"));

var _autoprefixer = _interopRequireDefault(require("autoprefixer"));

var _webpackBundleAnalyzer = require("webpack-bundle-analyzer");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const source = _path.default.resolve(process.argv[2]);

const target = process.argv[3];
const headless = process.env.EASE_HEADLESS === 'true';

const pathname = _path.default.resolve(target || '');

const directory = target ? _path.default.dirname(pathname) : 'dist';
const filename = target ? _path.default.basename(pathname) : 'bundle';
(0, _module_patch.default)(_utils.standard_transformer, _utils.standard_resolver);
let {
  build_dir = directory,
  public_path,
  hook,
  reload_url,
  host,
  port,
  name = filename,
  replacements = [],
  type,
  ...rest
} = _utils.webpack_opts;
const analyzer = new _webpackBundleAnalyzer.BundleAnalyzerPlugin({
  analyzerMode: 'static',
  reportFilename: 'report.html',
  openAnalyzer: false,
  logLevel: 'info'
});
const replacement_plugins = replacements.map(([key, value]) => new _webpack.default.NormalModuleReplacementPlugin(key, value));

const resolve = val => _path.default.resolve(__dirname, '../node_modules', val);

const polyfill_deps = type === 'lib' ? [] : ['babel-polyfill/dist/polyfill.min.js'].map(resolve);
const entry = {
  [name]: source
};
const output = type === 'lib' ? {
  path: _path.default.resolve(build_dir),
  filename: '[name].js',
  library: name,
  libraryTarget: 'umd'
} : {
  path: _path.default.resolve(build_dir),
  filename: '[name].js'
};

let webpack_settings = _lodash.default.defaultsDeep(rest, {
  entry,
  output,
  devtool: 'source-map',
  resolveLoader: {
    modules: [_path.default.resolve(__dirname, '../node_modules')]
  },
  resolve: {
    modules: ['node_modules', 'bower_components', process.cwd(), '.']
  },
  externals: [{
    'external': true,
    'regenerator': true
  }],
  target: 'web',
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
      use: 'shebang-loader'
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
      test: /\.ya?ml$/,
      loaders: ['json-loader', 'yaml-loader']
    }, {
      enforce: 'post',
      test: /\.txt$|\.pem$|\.crt$|\.key$/,
      loaders: ['raw-loader']
    }]
  }
});

if (hook) {
  const res = hook(webpack_settings, 'bundle-web');

  if (res) {
    webpack_settings = res;
  }
} // strip any server props


const {
  server,
  ...remainder
} = webpack_settings;
(0, _webpack.default)(remainder, (err, stats) => {
  if (err) {
    throw err;
  }

  log.info(stats.toString('normal'));
});