#!/usr/bin/env node

import setpath from './setpath';
import _ from 'lodash';

import webpack from 'webpack';
import serve from 'webpack-serve';
import path from 'path';
import patcher from './module_patch';
import {formatter, webpack_opts, babel_opts, standard_transformer, standard_transformer_filter, standard_resolver} from './utils';
import precss from 'precss';
import autoprefixer from 'autoprefixer';

const entry = path.resolve(process.argv[2]);
const output = process.argv[3];

const pathname = path.resolve(output || 'dist/bundle.js');
const directory = output ? path.dirname(pathname) : '/dist';
const filename = output ? path.basename(pathname) : 'bundle';

patcher(standard_transformer, standard_resolver);

let {build_dir, host = 'localhost', port = 8888, public_path = directory, hook, name = filename, type, ...rest} = webpack_opts;

const resolve = val => path.resolve(__dirname, '../node_modules', val);

// add hot loader plugin to babel
babel_opts.plugins = (babel_opts.plugins || []).concat('react-hot-loader/babel');

let webpack_settings = _.defaultsDeep(rest, {
  entry: {
    [name]: entry
  },
  output: {
    path: directory,
    filename: '[name].js',
    publicPath: public_path
  },
  devtool: 'cheap-module-inline-source-map',
  resolveLoader: {
    modules: [path.resolve(__dirname, '../node_modules')]
  },
  resolve: {
    modules: ['node_modules', 'bower_components', process.cwd()]
  },
  externals: [
    {
      'external': true,
      'regenerator': true
    }
  ],
  plugins: [
    new webpack.ProgressPlugin(formatter),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"dev"'
    }),
    new webpack.HotModuleReplacementPlugin()
    // new DashboardPlugin()
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
      test: /\.worker\.jsx?$/,
      loader: 'worker-loader',
      query: {
        inline: true,
        name: '[name].js'
      }
    }, {
      enforce: 'post',
      test: /\.(eot|woff|woff2|ttf|svg|png|jpg|gif)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      loader: 'url-loader',
      query: {
        limit: 30000,
        name: '[name]-[hash].[ext]'
      }
    }, {
      enforce: 'post',
      test: /\.s?css$/,
      use: ['style-loader', 'css-loader', 'sass-loader']
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
  },
  server: {
    publicPath: public_path,
    hot: true,
    historyApiFallback: true,
    host,
    port
  }
});

if (hook) {
  const res = hook(webpack_settings, 'run-web');
  if (res) {
    webpack_settings = res;
  }
}

const {server, ...webpack_config} = webpack_settings;

webpack_config.watch = true;

serve({config: webpack_config, ...server});
