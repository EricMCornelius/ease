#!/usr/bin/env node

import path from 'path';
import fs from 'fs';
import module from 'module';
import patcher from './module_patch';

global.__coverage__ = {};
global.__rootpath__ = process.cwd();
process.env.NODE_PATH = `${__rootpath__}:${__dirname}`;
module.Module._initPaths();

import {Collector, Reporter} from 'istanbul';
import {transform} from 'babel-core';

import polyfill from 'babel-polyfill';

let opts = {
  babelrc: false,
  presets: ['es2015', 'react', 'stage-2'],
  plugins: ['syntax-decorators', 'transform-decorators-legacy', '__coverage__']
};

process.on('beforeExit', () => {
  let collector = new Collector();
  collector.add(__coverage__);
  collector.files().forEach(file => {
    let file_coverage = collector.fileCoverageFor(file);
  });
  let final_coverage = collector.getFinalCoverage();
  fs.writeFileSync('coverage/coverage.json', JSON.stringify(final_coverage, null, 2));

  let reporter = new Reporter();
  reporter.add('lcov');
  reporter.write(collector, true, () => { });
});

let transformer = (content, filename) => {
  if (filename.indexOf('node_modules') !== -1) {
    return content;
  }

  let code = fs.readFileSync(filename).toString();
  opts.filename = filename;
  let transpiled = transform(code, opts).code;
  return transpiled;
};


let resolver = (request, parent) => {
  return (request.startsWith('babel-preset') || request.startsWith('babel-plugin')) ?
    path.resolve(__dirname, '../node_modules/', request) :
    request;
}

patcher(transformer, resolver);

require(process.argv[2]);
