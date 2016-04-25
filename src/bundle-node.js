#!/usr/bin/env node

import setpath from './setpath';

import webpack from 'webpack';
import path from 'path';
import patcher from './module_patch';

let entry = path.resolve(process.argv[2]);
let pathname = path.resolve(process.argv[3]);
let directory = path.dirname(pathname);
let filename = path.basename(pathname);
let libname = filename.split('.')[0];

const formatter = (percentage, message) => {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(`${(100.0 * percentage).toFixed(1)}%: ${message}`);
};

const babel_opts = {
  babelrc: false,
  presets: ['es2015', 'react', 'stage-2'],
  plugins: ['syntax-decorators', 'transform-decorators-legacy']
};

let transformer = (content, filename) => {
  return content;
};

let resolver = (request, parent) => {
  return (request.startsWith('babel-preset') || request.startsWith('babel-plugin')) ?
    path.resolve(__dirname, '../node_modules/', request) :
    request;
}

patcher(transformer, resolver);

webpack({
  entry,
  devtool: 'cheap-module-source-map',
  output: {
    path: directory,
    filename: filename,
    library: libname,
    libraryTarget: 'commonjs2'
  },
  resolveLoader: {
    root: path.resolve(__dirname, '../node_modules')
  },
  resolve: {
    modulesDirectories: ['node_modules']
  },
  externals: [
    {
      'external': true
    }
  ],
  target: 'node',
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
