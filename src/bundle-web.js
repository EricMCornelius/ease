#!/usr/bin/env node

import setpath from './setpath';

import webpack from 'webpack';
import path from 'path';
import patcher from './module_patch';
import {formatter, babel_opts, standard_transformer, standard_resolver} from './utils';

let entry = path.resolve(process.argv[2]);
let pathname = path.resolve(process.argv[3]);
let directory = path.dirname(pathname);
let filename = path.basename(pathname);
let libname = filename.split('.')[0];

patcher(standard_transformer, standard_resolver);

webpack({
  entry,
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
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel',
        query: babel_opts
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
}, (err, stats) => {
  if (err) {
    throw err;
  }

  console.log(stats.toString('normal'));
});
