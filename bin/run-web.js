#!/usr/bin/env node
'use strict';

var _setpath = require('./setpath');

var _setpath2 = _interopRequireDefault(_setpath);

var _webpack = require('webpack');

var _webpack2 = _interopRequireDefault(_webpack);

var _webpackDevServer = require('webpack-dev-server');

var _webpackDevServer2 = _interopRequireDefault(_webpackDevServer);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _module_patch = require('./module_patch');

var _module_patch2 = _interopRequireDefault(_module_patch);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var entry = _path2.default.resolve(process.argv[2]);

var publicPath = '/dist/bundle';

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
  return request.startsWith('babel-preset') || request.startsWith('babel-plugin') || request.startsWith('webpack-') ? _path2.default.resolve(__dirname, '../node_modules/', request) : request;
};

(0, _module_patch2.default)(transformer, resolver);

var webpack_config = (0, _webpack2.default)({
  entry: [_path2.default.resolve(__dirname, '../node_modules', 'webpack-dev-server/client') + '?http://localhost:8888', _path2.default.resolve(__dirname, '../node_modules', 'webpack/hot/only-dev-server'), entry],
  output: {
    path: '/dist',
    filename: 'bundle.js',
    publicPath: '/dist'
  },
  devtool: 'cheap-module-source-map',
  resolveLoader: {
    root: _path2.default.resolve(__dirname, '../node_modules')
  },
  resolve: {
    moduleDirectories: ['node_modules', 'bower_components']
  },
  externals: [{
    'external': true,
    'regenerator': true
  }],
  plugins: [new _webpack2.default.HotModuleReplacementPlugin()],
  module: {
    loaders: [{
      test: /\.jsx?$/,
      exclude: /(node_modules|bower_components)/,
      loader: 'react-hot'
    }, {
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

new _webpackDevServer2.default(webpack_config, {
  publicPath: '/dist',
  hot: true,
  historyApiFallback: true
}).listen(8888, 'localhost', function (err, result) {
  if (err) {
    return console.error(err);
  }

  console.log('Listening at localhost:8888');
});