#!/usr/bin/env node

import _ from 'lodash';
import setpath from './setpath';

import webpack from 'webpack';
import path from 'path';
import patcher from './module_patch';
import {formatter, webpack_opts, babel_opts, standard_transformer, standard_transformer_filter, standard_resolver} from './utils';
import precss from 'precss';
import autoprefixer from 'autoprefixer';

import {BundleAnalyzerPlugin} from 'webpack-bundle-analyzer';

const source = path.resolve(process.argv[2]);
const target = process.argv[3];

const headless = process.env.EASE_HEADLESS === 'true';

const pathname = path.resolve(target || '');
const directory = target ? path.dirname(pathname) : 'dist';
const filename = target ? path.basename(pathname) : 'bundle';

patcher(standard_transformer, standard_resolver);

let {build_dir = directory, public_path, hook, reload_url, host, port, name = filename, replacements = [], type, ...rest} = webpack_opts;

const analyzer = new BundleAnalyzerPlugin({
  analyzerMode: 'static',
  reportFilename: 'report.html',
  openAnalyzer: false,
  logLevel: 'info'
});

const replacement_plugins = replacements.map(([key, value]) => new webpack.NormalModuleReplacementPlugin(key, value));

const resolve = val => path.resolve(__dirname, '../node_modules', val);
const polyfill_deps = type === 'lib' ? [] : ['babel-polyfill/dist/polyfill.min.js'].map(resolve);

const entry = {
  [name]: source
};

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
    modules: ['node_modules', 'bower_components', process.cwd(), '.']
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
    ...replacement_plugins,
    new webpack.optimize.ModuleConcatenationPlugin(),
    analyzer
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
    },
    {
      enforce: 'post',
      test: /\.ya?ml$/,
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
