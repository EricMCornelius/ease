'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var opts = {
  babelrc: false,
  presets: ['es2015', 'react', 'stage-2'],
  plugins: ['syntax-decorators', 'transform-decorators-legacy', '__coverage__']
};

exports.default = opts;