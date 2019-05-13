#!/usr/bin/env node

import setpath from './setpath';

import path from 'path';
import fs from 'fs';
import module from 'module';
import patcher from './module_patch';
import {find} from 'shelljs';
import mkdirp from 'mkdirp';
import yaml from 'js-yaml';
import {babel_opts, coverage_opts, mocha_opts, eslint_opts, standard_resolver, standard_transformer_filter, log, cache, resolve_babel_plugin} from './utils';

import libCoverage from 'istanbul-lib-coverage';
import libSourceMaps from 'istanbul-lib-source-maps';
import istanbulReport from 'istanbul-lib-report';
import istanbulReports from 'istanbul-reports';

import {transform} from '@babel/core';
import {SourceCode, CLIEngine} from 'eslint';
import mocha from 'mocha';
import jv from 'junit-viewer';

import polyfill from '@babel/polyfill';
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

global.__tests__ = new mocha(mocha_opts);
global.__coverage__ = global.__coverage__ || {};
global.__linting__ = {
  results: [],
  errorCount: 0,
  warningCount: 0
};

let cli = new CLIEngine({
  ignore: true,
  useEslintrc: true,
  cache: false,
  ...eslint_opts
});

// istanbul plugin configuration
// see https://github.com/istanbuljs/nyc#selecting-files-for-coverage
babel_opts.plugins.push(resolve_babel_plugin('istanbul').concat(coverage_opts));

process.on('beforeExit', () => {
  mkdirp.sync('reports/coverage');
  mkdirp.sync('reports/style');
  mkdirp.sync('reports/tests');

  let formatter = cli.getFormatter();
  console.log(formatter(__linting__.results));

  let html_formatter = cli.getFormatter('html');
  fs.writeFileSync('reports/style/index.html', html_formatter(__linting__.results));

  const source_map_store = libSourceMaps.createSourceMapStore();
  const coverage_map = libCoverage.createCoverageMap(__coverage__);
  const {map, sourceFinder} = source_map_store.transformCoverage(coverage_map);
  const report_context = istanbulReport.createContext({
    dir: 'reports/coverage',
    sourceFinder
  });

  const tree = istanbulReport.summarizers.pkg(map);
  const coverageReporters = ['lcov', 'text', 'text-summary', 'json', 'cobertura'];
  coverageReporters.forEach(reporter => {
    tree.visit(istanbulReports.create(reporter, {}), report_context);
  });

  fs.writeFileSync('reports/tests/index.html', jv.junit_viewer('reports/tests'));
  process.exit(0);
});

const image_exts = ['svg', 'png', 'jpg', 'gif'];

let transformer = (content, filename) => {
  log.debug(`Processing file: ${filename}`);
  if (filename.endsWith('.css') || filename.endsWith('.scss')) {
    log.debug(`Skipping style file: ${filename}`);
    return '';
  }

  for (const image_ext of image_exts) {
    if (filename.endsWith(image_ext)) {
      log.debug(`Skipping image file: ${filename}`);
      return '';
    }
  }

  if (filename.endsWith('.yaml')) {
    log.debug(`Transforming yaml file: ${filename}`);
    return `module.exports = ${JSON.stringify(yaml.load(content))}`;
  }

  if (filename.endsWith('.txt') || filename.endsWith('.key') || filename.endsWith('.crt') || filename.endsWith('.pem')) {
    log.debug(`Transforming raw file: ${filename}`);
    return `module.exports = ${JSON.stringify(content.toString())}`;
  }

  if (filename.endsWith('.json')) {
    log.debug(`Loading json file: ${filename}`);
    return content;
  }

  if (!standard_transformer_filter(filename)) {
    log.debug(`Ignoring filtered file: ${filename}`);
    return content;
  }
  log.debug(`Transforming file: ${filename}`);

  let key = cache.hash(content);

  let lint = {};
  try {
    lint = cache.get(key + '.lint');
  }
  catch(err) {
    lint = filename.indexOf('node_modules') !== -1 ? {errorCount: 0, warningCount: 0, results: []} : cli.executeOnText(content, filename);
    cache.put(key + '.lint', lint);
  }

  const {results, warningCount, errorCount} = lint;
  if (results.length > 0) {

  __linting__.results.push(...results);
  __linting__.errorCount += lint.errorCount;
  __linting__.warningCount += lint.warningCount;

  }

  try {
    sourcemap_cache[filename] = key + '.map';
    let cached = cache.get(key + '.code');
    log.debug(`Retrieving cached transformed file: ${key + '.code'}`);
    return cached;
  }
  catch(err) {

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

const is_directory = filename => {
  try {
    return fs.lstatSync(filename).isDirectory();
  }
  catch (err) {
    return false;
  }
}

let entry = path.resolve(process.argv[2]);
let file_filter = process.argv[3] ? new RegExp(process.argv[3]):/\.js$/;

if (is_directory(entry)) {
  let files = find(entry).filter(arg => file_filter.test(arg) || arg.indexOf('_hooks.js') > 0).sort();
  files.forEach(file => {
    log.info('Adding test file:', file);
    __tests__.addFile(file);
  });
  __tests__.run();
}
else  {
  require(entry);
}
