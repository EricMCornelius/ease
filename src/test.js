#!/usr/bin/env node

import setpath from './setpath';

import path from 'path';
import fs from 'fs';
import module from 'module';
import patcher from './module_patch';
import {find} from 'shelljs';
import mkdirp from 'mkdirp';
import yaml from 'js-yaml';
import {babel_opts, eslint_opts, standard_resolver, standard_transformer_filter, log, cache} from './utils';

import {Collector, Reporter} from 'istanbul';
import {transform} from 'babel-core';
import {SourceCode, CLIEngine, linter} from 'eslint';
import mocha from 'mocha';
import jv from 'junit-viewer';

import polyfill from 'babel-polyfill';
import plugin from 'eslint-plugin-babel';

global.__tests__ = new mocha({
  timeout: 20000,
  reporter: 'mocha-jenkins-reporter',
  reporterOptions: {
    junit_report_name: 'tests',
    junit_report_path: 'reports/tests/report.xml',
    junit_report_stack: 1
  }
});
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
  if (filename.endsWith('.css') || filename.endsWith('.scss')) {
    return '';
  }

  if (filename.endsWith('.yaml')) {
    return `module.exports = ${JSON.stringify(yaml.load(content))}`;
  }

  if (filename.endsWith('.json')) {
    return content;
  }

  if (!standard_transformer_filter(filename)) {
    return content;
  }

  let code = fs.readFileSync(filename).toString();
  babel_opts.filename = filename;

  let key = cache.hash(code);

  let lint = {};
  try {
    lint = cache.get(key + '.lint');
  }
  catch(err) {
    let results = linter.verify(code, eslint_opts, filename);
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

  let transpiled = null;
  try {
    transpiled = cache.get(key + '.transpiled');
  }
  catch(err) {
    transpiled = transform(code, babel_opts).code;
    cache.put(key + '.transpiled', transpiled);
  }

  return transpiled;
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
process.argv = process.argv.slice(1);

if (is_directory(entry)) {
  let files = find(entry).filter(arg => /\.js$/.test(arg)).sort();
  files.forEach(file => {
    log.info('Adding test file:', file);
    __tests__.addFile(file);
  });
  __tests__.run();
}
else  {
  require(process.argv[2]);
}
