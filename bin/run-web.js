#!/usr/bin/env node
'use strict';

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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var entry = _path2.default.resolve(process.argv[2]);

var publicPath = '/dist';

(0, _module_patch2.default)(_utils.standard_transformer, _utils.standard_resolver);

var webpack_settings = _lodash2.default.defaultsDeep(_utils.webpack_opts, {
  entry: [_path2.default.resolve(__dirname, '../node_modules', 'webpack-dev-server/client') + ('?' + (_utils.webpack_opts.reload_url || 'http://localhost:8888')), _path2.default.resolve(__dirname, '../node_modules', 'webpack/hot/only-dev-server'), _path2.default.resolve(__dirname, '../node_modules', 'babel-polyfill/dist/polyfill.min.js'), entry],
  output: {
    path: '/dist',
    filename: 'bundle.js',
    publicPath: publicPath
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
      include: _utils.standard_transformer_filter,
      loader: 'react-hot'
    }, {
      test: /\.jsx?$/,
      include: _utils.standard_transformer_filter,
      loader: 'babel',
      query: _utils.babel_opts
    }, {
      test: /\.(eot|woff|woff2|ttf|svg|png|jpg|gif)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      loader: 'url-loader?limit=30000&name=[name]-[hash].[ext]'
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
});

_utils.webpack_opts.hook && _utils.webpack_opts.hook(webpack_settings);

var webpack_config = (0, _webpack2.default)(webpack_settings, function (err, stats) {
  if (err) {
    throw err;
  }

  console.log(stats.toString('normal'));
});

new _webpackDevServer2.default(webpack_config, {
  publicPath: publicPath,
  hot: true,
  historyApiFallback: publicPath
}).listen(_utils.webpack_opts.port || 8888, 'localhost', function (err, result) {
  if (err) {
    return console.error(err);
  }

  console.log('Listening at localhost:' + (_utils.webpack_opts.port || 8888));
});