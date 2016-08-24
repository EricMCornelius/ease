#!/usr/bin/env node

import _ from 'lodash';
import setpath from './setpath';

import webpack from 'webpack';
import path from 'path';
import patcher from './module_patch';
import {formatter, webpack_opts, babel_opts, standard_transformer, standard_transformer_filter, standard_resolver} from './utils';
import precss from 'precss';
import autoprefixer from 'autoprefixer';

let entry = path.resolve(process.argv[2]);
let pathname = path.resolve(process.argv[3]);
let directory = path.dirname(pathname);
let filename = path.basename(pathname);
let libname = filename.split('.')[0];

patcher(standard_transformer, standard_resolver);

webpack(
_.defaultsDeep(webpack_opts, {
  entry: [
    path.resolve(__dirname, '../node_modules', 'babel-polyfill/dist/polyfill.min.js'),
    entry
  ],
  devtool: 'cheap-module-source-map',
  output: {
    path: directory,
    filename: filename
  },
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
  target: 'web',
  plugins: [
    new webpack.ProgressPlugin(formatter),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"production"'
    }),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin()
  ],
  postcss() {
    return [autoprefixer];
  },
  module: {
    preLoaders: [
      {
        test: /\.jsx?$/,
        loader: 'shebang'
      }
    ],
    loaders: [
      {
        test: /\.jsx?$/,
        include: standard_transformer_filter,
        loader: 'babel',
        query: babel_opts
      },
      {
        test: /\.svg$/,
        loader: 'svg-url-loader'
      },
      {
        test: /\.png$/,
        loader: 'url-loader?mimetype=image/png'
      },
      {
        test: /\.jpg$/,
        loader: 'url-loader?mimetype=image/jpg'
      },
      {
        test: /\.gif$/,
        loader: 'url-loader?mimetype=image/gif'
      },
      {
        test: /\.s?css$/,
        loaders: ['style', 'css', 'postcss', 'sass']
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
        test: /\.txt$|\.pem$|\.crt$|\.key$/,
        loaders: ['raw']
      }
    ]
  }
}), (err, stats) => {
  if (err) {
    throw err;
  }

  console.log(stats.toString('normal'));
});
