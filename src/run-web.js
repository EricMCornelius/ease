#!/usr/bin/env node

import setpath from './setpath';

import webpack from 'webpack';
import webpack_dev_server from 'webpack-dev-server';
import path from 'path';
import patcher from './module_patch';

let entry = path.resolve(process.argv[2]);

const publicPath = '/dist/bundle';

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

let webpack_config = webpack({
  entry: [
    'webpack-dev-server/client?http://localhost:8888',
    'webpack/hot/only-dev-server',
    entry
  ],
  output: {
    path: '/dist',
    filename: 'bundle.js'
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
  // target: 'node',
  plugins: [

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

new webpack_dev_server(webpack_config, {
  // publicPath: '/dist/bundle',
  hot: true,
  historyApiFallback: true
}).listen(8888, 'localhost', (err, result) => {
  if (err) {
    return console.error(err);
  }

  console.log(`Listening at localhost:8888`);
});
