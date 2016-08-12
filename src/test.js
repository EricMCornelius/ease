#!/usr/bin/env node

import setpath from './setpath';

import path from 'path';
import fs from 'fs';
import module from 'module';
import patcher from './module_patch';
import {find} from 'shelljs';
import mkdirp from 'mkdirp';
import yaml from 'js-yaml';
import {babel_opts, mocha_opts, eslint_opts, standard_resolver, standard_transformer_filter, log, cache} from './utils';

import {Collector, Reporter} from 'istanbul';
import {transform} from 'babel-core';
import {SourceCode, CLIEngine, linter} from 'eslint';
import mocha from 'mocha';
import jv from 'junit-viewer';

import polyfill from 'babel-polyfill';
import sourcemaps from 'source-map-support';
import plugin from 'eslint-plugin-babel';

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
global.__coverage__ = {};
global.__linting__ = {
  results: [],
  errorCount: 0,
  warningCount: 0
};

let cli = new CLIEngine({
  ignore: true,
  useEslintrc: true
});

cli.addPlugin('eslint-plugin-babel', plugin);

babel_opts.plugins.push('__coverage__');

process.on('beforeExit', () => {
  mkdirp.sync('reports/coverage');
  mkdirp.sync('reports/style');
  mkdirp.sync('reports/tests');

  let formatter = cli.getFormatter();
  console.log(formatter(__linting__.results));

  let html_formatter = cli.getFormatter('html');
  fs.writeFileSync('reports/style/index.html', html_formatter(__linting__.results));

  let collector = new Collector();
  collector.add(__coverage__);
  collector.files().forEach(file => {
    let file_coverage = collector.fileCoverageFor(file);
  });
  let final_coverage = collector.getFinalCoverage();

  let reporter = new Reporter(false, 'reports/coverage');
  reporter.add('lcov');
  reporter.add('text');
  reporter.add('text-summary');
  reporter.add('json');
  reporter.add('cobertura');
  reporter.write(collector, true, () => { });

  fs.writeFileSync('reports/tests/index.html', jv.junit_viewer('reports/tests'));
  process.exit(0);
});

let transformer = (content, filename) => {
  log.debug(`Processing file: ${filename}`);
  if (filename.endsWith('.css') || filename.endsWith('.scss')) {
    log.debug(`Skipping style file: ${filename}`);
    return '';
  }

  if (filename.endsWith('.yaml')) {
    log.debug(`Transforming yaml file: ${filename}`);
    return `module.exports = ${JSON.stringify(yaml.load(content))}`;
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
    let results = linter.verify(content, eslint_opts, filename);
    let [errors, warnings] = results.reduce(
      (agg, result) => {
        agg[result.severity - 1]++;
        return agg;
      },
      [0, 0]
    );
    lint = {errors, warnings, results};
    cache.put(key + '.lint', lint);
  }

  __linting__.results.push({
    filePath: filename,
    messages: lint.results,
    errorCount: lint.errors,
    warningCount: lint.warnings
  });

  __linting__.errorCount += lint.errors;
  __linting__.warningCount += lint.warnings;

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
