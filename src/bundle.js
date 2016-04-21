#!/usr/bin/env node

import webpack from 'webpack';
import path from 'path';

let entry = path.resolve(process.argv[2]);
let pathname = path.resolve(process.argv[3]);
let directory = path.dirname(pathname);
let filename = path.basename(pathname);
let libname = filename.split('.')[0];

const formatter = (percentage, message) => {
  process.stdout.write(`\r${(100.0 * percentage).toFixed(1)}%: ${message}                 `);
};

webpack({
  entry,
  output: {
    path: directory,
    filename: filename,
    library: libname,
    libraryTarget: 'commonjs2'
  },
  externals: [
    {
      './external': 'external'
    }
  ],
  target: 'node',
  plugins: [
    new webpack.ProgressPlugin(formatter),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin()
  ],
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        loaders: ['babel']
      },
      {
        test: /\.json$/,
        loaders: ['json']
      }
    ]
  }
}, (err, stats) => {
  if (err) {
    throw err;
  }

  console.log(stats.toString('normal'));
});
