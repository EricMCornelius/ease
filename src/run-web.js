#!/usr/bin/env node

import setpath from './setpath';
import {defaultsDeep} from 'lodash';

import {parse} from 'url';
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

let {build_dir, reload_url = 'ws://localhost:8081', backend_url = 'ws://localhost:8081', host = 'localhost', port = 8888, public_path = directory, hook, name = filename, type, ...rest} = webpack_opts;

const public_websocket = parse(reload_url);
const private_websocket = parse(backend_url);

const use_https = public_websocket.protocol === 'wss:';

const resolve = val => path.resolve(__dirname, '../node_modules', val);

// add hot loader plugin to babel
babel_opts.plugins = (babel_opts.plugins || []).concat('react-hot-loader/babel');

let webpack_settings = defaultsDeep(rest, {
  entry: {
    [name]: entry
  },
  output: {
    path: directory,
    filename: '[name].js',
    publicPath: public_path,
    globalObject: 'this' // TODO: re-evaulate after https://github.com/webpack/webpack/issues/6642 ...
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
    })
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
      test: /\.yaml$/,
      loaders: ['json-loader', 'yaml-loader']
    }, {
      enforce: 'post',
      test: /\.txt$/,
      loaders: ['raw-loader']
    }]
  },
  watch: true,
  serve: {
    host,
    port,
    dev: {
      publicPath: public_path
    },
    hotClient: {
      https: use_https,
      host: {
        server: private_websocket.hostname,
        client: public_websocket.hostname
      },
      port: {
        server: private_websocket.port,
        client: public_websocket.port
      }
    }
  }
});

if (hook) {
  const res = hook(webpack_settings, 'run-web');
  if (res) {
    webpack_settings = res;
  }
}

const config = webpack_settings;

serve({config});
