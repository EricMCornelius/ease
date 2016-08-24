#!/usr/bin/env node

import setpath from './setpath';

import path from 'path';
import fs from 'fs';
import module from 'module';
import patcher from './module_patch';
import {babel_opts, standard_resolver, standard_transformer_filter, log, cache} from './utils';
import yaml from 'js-yaml';

import {transform} from 'babel-core';
import polyfill from 'babel-polyfill';
import sourcemaps from 'source-map-support';

const sourcemap_cache = {};

sourcemaps.install({
  environment: 'node',
  retrieveSourceMap(source) {
    log.debug(`Checking sourcemap for source: ${source}`);
    let sourcemap = sourcemap_cache[source];
    if (!sourcemap) { return null; }
    log.debug(`Retrieving sourcemap ${sourcemap}`);

    return {
      url: source,
      map: cache.get(sourcemap)
    };
  }
});

let entry = path.resolve(process.argv[2]);

let transformer = (content, filename) => {
  log.debug(`Processing file: ${filename}`);
  if (!standard_transformer_filter(filename)) {
    log.debug(`Ignoring filtered file: ${filename}`);
    return content;
  }

  if (filename.endsWith('.css') || filename.endsWith('.scss')) {
    log.debug(`Skipping style file: ${filename}`);
    return '';
  }

  if (filename.endsWith('.json')) {
    log.debug(`Loading json file: ${filename}`);
    return content;
  }

  log.debug(`Transforming file: ${filename}`);

  let key = cache.hash(content);
  try {
    sourcemap_cache[filename] = key + '.map';
    let cached = cache.get(key + '.code');
    log.debug(`Retrieving cached transformed file: ${key + '.code'}`);
    return cached;
  }
  catch(err) {

  }

  // yaml transformation
  if (filename.endsWith('.yaml')) {
    log.debug(`Transforming yaml file: ${filename}`);
    const transformed = `module.exports = ${JSON.stringify(yaml.load(content))}`;
    cache.put(key + '.code', transformed);
    return transformed;
  }

  // raw import
  if (filename.endsWith('.txt') || filename.endsWith('.key') || filename.endsWith('.crt') || filename.endsWith('.pem')) {
    log.debug(`Transforming raw file: ${filename}`);
    const transformed = `module.exports = ${JSON.stringify(content.toString())}`;
    cache.put(key + '.code', transformed);
    return transformed;
  }

  babel_opts.filename = filename;

  let transpiled = transform(content, {...babel_opts, sourceMaps: true});
  cache.put(key + '.map', transpiled.map);
  let source_map = path.resolve(process.cwd(), '.ease_cache', key + '.map');
  
  let transpiled_code = `${transpiled.code}\n//# sourceMappingURL=${source_map}`;
  cache.put(key + '.code', transpiled_code);
  return transpiled_code;
};

patcher(transformer, standard_resolver);

require(entry);
