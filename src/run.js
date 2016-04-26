#!/usr/bin/env node

import setpath from './setpath';

import path from 'path';
import fs from 'fs';
import module from 'module';
import patcher from './module_patch';
import {babel_opts, standard_resolver} from './utils';

import {transform} from 'babel-core';
import polyfill from 'babel-polyfill';

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
  babel_opts.filename = filename;

  let transpiled = transform(code, babel_opts);
  return transpiled.code;
};

patcher(transformer, standard_resolver);

require(entry);
