#!/usr/bin/env node

import setpath from './setpath';
import _ from 'lodash';

import webpack from 'webpack';
import webpack_dev_server from 'webpack-dev-server';
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

let {build_dir, host = 'localhost', port = 8888, reload_url, public_path = directory, hook, name = filename, vendor = [], type, ...rest} = webpack_opts;

if (port && !reload_url) {
  reload_url = `http://${host}:${port}`;
}

const resolve = val => path.resolve(__dirname, '../node_modules', val);

const reload_deps = [`webpack-dev-server/client`, 'webpack/hot/only-dev-server'].map(resolve);
reload_deps[0] += `?${reload_url}`;

const polyfill_deps = ['babel-polyfill/dist/polyfill.min.js'].map(resolve);

vendor = [...polyfill_deps, ...vendor];
if (vendor.length === 1) vendor = vendor[0];

let webpack_settings = _.defaultsDeep(rest, {
  entry: {
    [name]: [
      ...reload_deps,
      entry
    ],
    vendor
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
    modules: ['node_modules', 'bower_components']
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

const {server, ...remainder} = webpack_settings;

const webpack_config = webpack(remainder, (err, stats) => {
  if (err) {
    throw err;
  }

  console.log(stats.toString('normal'));
});

const {host: server_host, port: server_port, ...server_config} = server;

new webpack_dev_server(webpack_config, server_config).listen(server_port, server_host, (err, result) => {
  if (err) {
    return console.error(err);
  }

  console.log(`Listening at ${host}:${port}`);
});
