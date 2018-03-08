#!/usr/bin/env node
'use strict';

var _ref3;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

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

var _webpackBundleAnalyzer = require('webpack-bundle-analyzer');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var source = _path2.default.resolve(process.argv[2]);
var target = process.argv[3];

var headless = process.env.EASE_HEADLESS === 'true';

var pathname = _path2.default.resolve(target || '');
var directory = target ? _path2.default.dirname(pathname) : 'dist';
var filename = target ? _path2.default.basename(pathname) : 'bundle';

(0, _module_patch2.default)(_utils.standard_transformer, _utils.standard_resolver);

var _webpack_opts$build_d = _utils.webpack_opts.build_dir,
    build_dir = _webpack_opts$build_d === undefined ? directory : _webpack_opts$build_d,
    public_path = _utils.webpack_opts.public_path,
    hook = _utils.webpack_opts.hook,
    reload_url = _utils.webpack_opts.reload_url,
    host = _utils.webpack_opts.host,
    port = _utils.webpack_opts.port,
    _webpack_opts$name = _utils.webpack_opts.name,
    name = _webpack_opts$name === undefined ? filename : _webpack_opts$name,
    _webpack_opts$vendor = _utils.webpack_opts.vendor,
    vendor = _webpack_opts$vendor === undefined ? [] : _webpack_opts$vendor,
    _webpack_opts$replace = _utils.webpack_opts.replacements,
    replacements = _webpack_opts$replace === undefined ? [] : _webpack_opts$replace,
    type = _utils.webpack_opts.type,
    rest = _objectWithoutProperties(_utils.webpack_opts, ['build_dir', 'public_path', 'hook', 'reload_url', 'host', 'port', 'name', 'vendor', 'replacements', 'type']);

var analyzer = new _webpackBundleAnalyzer.BundleAnalyzerPlugin({
  analyzerMode: 'static',
  reportFilename: 'report.html',
  openAnalyzer: false,
  logLevel: 'info'
});

var replacement_plugins = replacements.map(function (_ref) {
  var _ref2 = _slicedToArray(_ref, 2),
      key = _ref2[0],
      value = _ref2[1];

  return new _webpack2.default.NormalModuleReplacementPlugin(key, value);
});

var resolve = function resolve(val) {
  return _path2.default.resolve(__dirname, '../node_modules', val);
};
var polyfill_deps = type === 'lib' ? [] : ['babel-polyfill/dist/polyfill.min.js'].map(resolve);

vendor = [].concat(_toConsumableArray(polyfill_deps), _toConsumableArray(vendor));
if (vendor.length === 1) vendor = vendor[0];

var entry = vendor.length > 0 ? (_ref3 = {}, _defineProperty(_ref3, name, source), _defineProperty(_ref3, 'vendor', vendor), _ref3) : _defineProperty({}, name, source);

var output = type === 'lib' ? {
  path: _path2.default.resolve(build_dir),
  filename: '[name].js',
  library: name,
  libraryTarget: 'umd'
} : {
  path: _path2.default.resolve(build_dir),
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
    modules: ['node_modules', 'bower_components', process.cwd()]
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
  })].concat(_toConsumableArray(replacement_plugins), [new _webpack2.default.optimize.ModuleConcatenationPlugin(), analyzer]),
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
  var res = hook(webpack_settings, 'bundle-web');
  if (res) {
    webpack_settings = res;
  }
}

// strip any server props

var _webpack_settings = webpack_settings,
    server = _webpack_settings.server,
    remainder = _objectWithoutProperties(_webpack_settings, ['server']);

(0, _webpack2.default)(remainder, function (err, stats) {
  if (err) {
    throw err;
  }

  console.log(stats.toString('normal'));
});