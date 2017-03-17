#!/usr/bin/env node

import _ from 'lodash';
import setpath from './setpath';

import webpack from 'webpack';
import path from 'path';
import patcher from './module_patch';
import {formatter, webpack_opts, babel_opts, standard_transformer, standard_transformer_filter, standard_resolver} from './utils';

const entry = path.resolve(process.argv[2]);
const pathname = path.resolve(process.argv[3]);
const directory = path.dirname(pathname);
const filename = path.basename(pathname);
const libname = filename.split('.')[0];

patcher(standard_transformer, standard_resolver);

const {hook, reload_url, port, name, ...rest} = webpack_opts;

let webpack_settings = _.defaultsDeep(rest, {
  entry,
  devtool: 'cheap-module-source-map',
  output: {
    path: directory,
    filename: filename,
    library: libname,
    libraryTarget: 'commonjs2'
  },
  resolveLoader: {
    modules: [path.resolve(__dirname, '../node_modules')]
  },
  resolve: {
    modules: ['node_modules', '.']
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
    new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: false
    }),
    new webpack.optimize.UglifyJsPlugin({
      beautify: false,
      mangle: {
        screw_ie8: true,
        keep_fnames: true
      },
      compress: {
        screw_ie8: true
      },
      comments: false
    })
  ],
  module: {
    rules: [{
      enforce: 'pre',
      test: /\.jsx?$/,
      loader: 'shebang-loader'
    }, {
      enforce: 'post',
      test: /\.jsx?$/,
      include: standard_transformer_filter,
      loader: 'babel-loader',
      query: babel_opts
    }, {
      enforce: 'post',
      test: /\.s?css$/,
      loaders: ['style-loader', 'css-loader', 'sass-loader']
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
      test: /\.txt$|\.pem$|\.crt$|\.key$|\.ps1$|\.sh/,
      loaders: ['raw-loader']
    }]
  }
});

if (hook) {
  const res = hook(webpack_settings, 'bundle-node');
  if (res) {
    webpack_settings = res;
  }
}

webpack(webpack_settings, (err, stats) => {
  if (err) {
    throw err;
  }

  console.log(stats.toString('normal'));
});
