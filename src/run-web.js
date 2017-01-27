#!/usr/bin/env node

import setpath from './setpath';
import _ from 'lodash';

import webpack from 'webpack';
import webpack_dev_server from 'webpack-dev-server';
import path from 'path';
import patcher from './module_patch';
import {formatter, webpack_opts, babel_opts, standard_transformer, standard_transformer_filter, standard_resolver} from './utils';

let entry = path.resolve(process.argv[2]);

const publicPath = '/dist';

patcher(standard_transformer, standard_resolver);

const webpack_settings = _.defaultsDeep(webpack_opts, {
  entry: [
    path.resolve(__dirname, '../node_modules', 'webpack-dev-server/client') + `?${webpack_opts.reload_url || 'http://localhost:8888'}`,
    path.resolve(__dirname, '../node_modules', 'webpack/hot/only-dev-server'),
    path.resolve(__dirname, '../node_modules', 'babel-polyfill/dist/polyfill.min.js'),
    entry
  ],
  output: {
    path: '/dist',
    filename: 'bundle.js',
    publicPath
  },
  // devtool: 'cheap-module-source-map',
  resolveLoader: {
    modules: [path.resolve(__dirname, '../node_modules')]
  },
  resolve: {
    modules: ['node_modules', 'bower_components']
  },
  externals: [
    {
      'external': true,
      'regenerator': true
    }
  ],
  plugins: [
    new webpack.HotModuleReplacementPlugin()
  ],
  module: {
    rules: [{
      enforce: 'pre',
      test: /\.jsx?$/,
      include: standard_transformer_filter,
      loader: 'react-hot-loader/webpack'
    }, {
      enforce: 'post',
      test: /\.jsx?$/,
      include: standard_transformer_filter,
      loader: 'babel-loader',
      query: babel_opts
    }, {
      enforce: 'post',
      test: /\.(eot|woff|woff2|ttf|svg|png|jpg|gif)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      loader: 'url-loader?limit=30000&name=[name]-[hash].[ext]'
    }, {
      enforce: 'post',
      test: /\.s?css$/,
      use: [
        'style-loader',
        { loader: 'css-loader', options: { modules: true, importLoaders: 1 } },
        { loader: 'postcss-loader', options: { plugins: () => [...plugins] } },
        'sass-loader'
      ]
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
  }
});

webpack_settings.hook && webpack_settings.hook(webpack_settings);
delete webpack_settings.hook;

let webpack_config = webpack(webpack_settings, (err, stats) => {
  if (err) {
    throw err;
  }

  console.log(stats.toString('normal'));
});

new webpack_dev_server(webpack_config, {
  publicPath,
  hot: true,
  historyApiFallback: true
}).listen(webpack_opts.port || 8888, 'localhost', (err, result) => {
  if (err) {
    return console.error(err);
  }

  console.log(`Listening at localhost:${webpack_opts.port || 8888}`);
});
