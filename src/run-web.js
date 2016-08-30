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
  devtool: 'cheap-module-source-map',
  resolveLoader: {
    root: path.resolve(__dirname, '../node_modules')
  },
  resolve: {
    moduleDirectories: ['node_modules', 'bower_components']
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
    loaders: [
      {
        test: /\.jsx?$/,
        include: standard_transformer_filter,
        loader: 'react-hot'
      },
      {
        test: /\.jsx?$/,
        include: standard_transformer_filter,
        loader: 'babel',
        query: babel_opts
      },
      {
        test: /\.(eot|woff|woff2|ttf|svg|png|jpg|gif)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'url-loader?limit=30000&name=[name]-[hash].[ext]'
      },
      {
        test: /\.s?css$/,
        loaders: ['style', 'css', 'sass']
      },
      {
        test: /\.json$/,
        loaders: ['json']
      },
      {
        test: /\.yaml$/,
        loaders: ['json', 'yaml']
      },
      {
        test: /\.txt$/,
        loaders: ['raw']
      }
    ]
  }
});

webpack_opts.hook && webpack_opts.hook(webpack_settings);

let webpack_config = webpack(webpack_settings, (err, stats) => {
  if (err) {
    throw err;
  }

  console.log(stats.toString('normal'));
});

new webpack_dev_server(webpack_config, {
  publicPath,
  hot: true,
  historyApiFallback: publicPath
}).listen(webpack_opts.port || 8888, 'localhost', (err, result) => {
  if (err) {
    return console.error(err);
  }

  console.log(`Listening at localhost:${webpack_opts.port || 8888}`);
});
