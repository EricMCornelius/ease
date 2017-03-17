#!/usr/bin/env node

import _ from 'lodash';
import setpath from './setpath';

import webpack from 'webpack';
import path from 'path';
import patcher from './module_patch';
import {formatter, webpack_opts, babel_opts, standard_transformer, standard_transformer_filter, standard_resolver} from './utils';
import precss from 'precss';
import autoprefixer from 'autoprefixer';
import ExtractTextPlugin from 'extract-text-webpack-plugin';

const source = path.resolve(process.argv[2]);
const target = process.argv[3];

const pathname = path.resolve(target || '');
const directory = target ? path.dirname(pathname) : 'dist';
const filename = target ? path.basename(pathname) : null;

patcher(standard_transformer, standard_resolver);

let {hook, reload_url, port, name = filename, vendor = [], type, ...rest} = webpack_opts;

const resolve = val => path.resolve(__dirname, '../node_modules', val);
const polyfill_deps = type === 'lib' ? [] : ['babel-polyfill/dist/polyfill.min.js'].map(resolve);

vendor = [...polyfill_deps, ...vendor];
if (vendor.length === 1) vendor = vendor[0];

const entry = vendor.length > 0 ? {
  [name]: source,
  vendor
} : {
  [name]: source
}

const output = type === 'lib' ? {
  path: directory,
  filename: '[name].js',
  library: name,
  libraryTarget: 'umd'
} : {
  path: directory,
  filename: '[name].js'
};

let webpack_settings = _.defaultsDeep(rest, {
  entry,
  output,
  devtool: 'source-map',
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
  target: 'web',
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
    }),
    new ExtractTextPlugin(name ? `${name}.css` : '[name].css'),
    ...(type === 'lib' ? [] : [new webpack.optimize.CommonsChunkPlugin({ names: ['vendor', 'manifest'] })])
  ],
  module: {
    rules: [{
      enforce: 'pre',
      test: /\.jsx?$/,
      use: 'shebang-loader'
    }, {
      enforce: 'post',
      test: /\.jsx?$/,
      include: standard_transformer_filter,
      loader: 'babel-loader',
      query: babel_opts
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
      use: ExtractTextPlugin.extract({
        fallback: 'style-loader',
        use: [
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
              modules: false,
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              plugins: () => [precss, autoprefixer]
            }
          },
          {
            loader: 'sass-loader',
          }
        ]
      })
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
      test: /\.txt$|\.pem$|\.crt$|\.key$/,
      loaders: ['raw-loader']
    }]
  }
});

if (hook) {
  const res = hook(webpack_settings, 'bundle-web');
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
