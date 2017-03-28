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
import {BundleAnalyzerPlugin} from 'webpack-bundle-analyzer';
import DashboardPlugin from 'webpack-dashboard/plugin';

const source = path.resolve(process.argv[2]);
const target = process.argv[3];

const headless = process.env.EASE_HEADLESS === 'true';

const pathname = path.resolve(target || '');
const directory = target ? path.dirname(pathname) : 'dist';
const filename = target ? path.basename(pathname) : null;

patcher(standard_transformer, standard_resolver);

let {build_dir = directory, public_path, hook, reload_url, host, port, name = filename, vendor = [], type, ...rest} = webpack_opts;

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
  path: path.resolve(build_dir),
  filename: '[name].js',
  library: name,
  libraryTarget: 'umd'
} : {
  path: path.resolve(build_dir),
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
    ...(type === 'lib' ? [] : [new webpack.optimize.CommonsChunkPlugin({ names: ['vendor', 'manifest'] })]),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"production"'
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: false
    }),
    new webpack.optimize.UglifyJsPlugin({
      beautify: false,
      sourceMap: true,
      mangle: true,
      compress: true,
      comments: false
    }),
    new ExtractTextPlugin(name ? `${name}.css` : '[name].css'),
    ...(headless ? [] : [
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        openAnalyzer: true,
        generateStatsFile: true
      }),
      new DashboardPlugin()
    ])
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

// strip any server props
const {server, ...remainder} = webpack_settings;

webpack(remainder, (err, stats) => {
  if (err) {
    throw err;
  }

  console.log(stats.toString('normal'));
});
