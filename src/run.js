#!/usr/bin/env node

import setpath from './setpath';

import path from 'path';
import fs from 'fs';
import module from 'module';
import patcher from './module_patch';
import {babel_opts, standard_resolver, standard_transformer_filter, log, cache} from './utils';

import {transform} from 'babel-core';
import polyfill from 'babel-polyfill';

let entry = path.resolve(process.argv[2]);

let transformer = (content, filename) => {
  log.debug(`Processing file: ${filename}`);
  if (!standard_transformer_filter(filename)) {
    return content;
  }

  let key = cache.hash(content);
  try {
    return cache.get(key);
  }
  catch(err) {

  }

  let code = fs.readFileSync(filename).toString();
  babel_opts.filename = filename;

  let transpiled = transform(code, babel_opts);
  cache.put(key, transpiled.code);
  return transpiled.code;
};

patcher(transformer, standard_resolver);

process.argv = process.argv.slice(1);

require(entry);
