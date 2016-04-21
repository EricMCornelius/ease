#!/usr/bin/env node

import setpath from './setpath';
import path from 'path';
import fs from 'fs';
import module from 'module';
import patcher from './module_patch';

global.__rootpath__ = process.cwd();
process.env.NODE_PATH = `${__rootpath__}:${__dirname}`;
module.Module._initPaths();

import {transform} from 'babel-core';
import polyfill from 'babel-polyfill';

let opts = {
  babelrc: false,
  presets: ['es2015', 'react', 'stage-2'],
  plugins: ['syntax-decorators', 'transform-decorators-legacy']
};

let entry = process.argv[2];
let single = (entry === '--entry');
if (single) {
  entry = path.resolve(process.argv[3]);
}
else {
  entry = path.resolve(entry);
}

let transformer = (content, filename) => {
  if (single && filename !== entry) {
    return content;
  }

  if (filename.indexOf('node_modules') !== -1) {
    if (filename.indexOf('node_modules/datastore') === -1) {
      return content;
    }
  }

  let code = fs.readFileSync(filename).toString();
  opts.filename = filename;

  let transpiled = transform(code, opts);
  return transpiled.code;
};

let resolver = (request, parent) => {
  return (request.startsWith('babel-preset') || request.startsWith('babel-plugin')) ?
    path.resolve(__dirname, '../node_modules/', request) :
    request;
}

patcher(transformer, resolver);

require(entry);
