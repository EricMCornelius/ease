#!/usr/bin/env node

import setpath from './setpath';

import path from 'path';
import fs from 'fs';
import module from 'module';
import patcher from './module_patch';
import {babel_opts, standard_resolver, standard_transformer_filter, log, cache} from './utils';

import {transform} from 'babel-core';
import polyfill from 'babel-polyfill';
import sourcemaps from 'source-map-support';

const sourcemap_cache = {};

sourcemaps.install({
  environment: 'node',
  retrieveSourceMap(source) {
    let sourcemap = sourcemap_cache[source];
    if (!sourcemap) { return null; }
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
    return content;
  }

  let key = cache.hash(content);
  try {
    sourcemap_cache[filename] = key + '.map';
    return cache.get(key + '.code');
  }
  catch(err) {
    console.log(err);
  }

  let code = fs.readFileSync(filename).toString();
  babel_opts.filename = filename;

  let transpiled = transform(code, {...babel_opts, sourceMaps: 'both'});
  cache.put(key + '.map', transpiled.map);
  let source_map = path.resolve(process.cwd(), '.ease_cache', key + '.map');
  let transpiled_code = `//# sourceMappingURL=${source_map}\n${transpiled.code}`;
  cache.put(key + '.code', transpiled_code);
  return transpiled_code;
};

patcher(transformer, standard_resolver);

require(entry);
