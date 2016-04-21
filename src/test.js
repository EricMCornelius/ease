#!/usr/bin/env node

import setpath from './setpath';

import path from 'path';
import fs from 'fs';
import module from 'module';
import patcher from './module_patch';
import {find} from 'shelljs';
import mkdirp from 'mkdirp';

import {Collector, Reporter} from 'istanbul';
import {transform} from 'babel-core';
import {SourceCode, CLIEngine, linter} from 'eslint';
import mocha from 'mocha';
import jv from 'junit-viewer';

import polyfill from 'babel-polyfill';
import plugin from 'eslint-plugin-babel';

global.__tests__ = new mocha({
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

let opts = {
  babelrc: false,
  presets: ['es2015', 'react', 'stage-2'],
  plugins: ['syntax-decorators', 'transform-decorators-legacy', '__coverage__']
};

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
  reporter.write(collector, true, () => { });

  fs.writeFileSync('reports/tests/index.html', jv.junit_viewer('reports/tests'));
  process.exit(0);
});

let lint_settings = JSON.parse(fs.readFileSync('.eslintrc'));

let transformer = (content, filename) => {
  if (filename.indexOf('node_modules') !== -1) {
    if (filename.indexOf('node_modules/datastore') === -1) {
      return content;
    }
  }

  let code = fs.readFileSync(filename).toString();
  opts.filename = filename;

  let lint_results = linter.verify(code, lint_settings, filename);
  let [errorCount, warningCount] = lint_results.reduce(
    (agg, result) => {
      agg[result.severity - 1]++;
      return agg;
    },
    [0, 0]
  ); 

  __linting__.results.push({
    filePath: filename,
    messages: lint_results,
    errorCount,
    warningCount
  });

  __linting__.errorCount += errorCount;
  __linting__.warningCount += warningCount;

  let transpiled = transform(code, opts);

  return transpiled.code;
};


let resolver = (request, parent) => {
  return (request.startsWith('babel-preset') || request.startsWith('babel-plugin')) ?
    path.resolve(__dirname, '../node_modules/', request) :
    request;
}

patcher(transformer, resolver);

const is_directory = filename => {
  try {
    return fs.lstatSync(filename).isDirectory();
  }
  catch (err) {
    return false;
  }
}

let entry = path.resolve(process.argv[2]);
if (is_directory(entry)) {
  let files = find(entry).filter(arg => /\.js$/.test(arg)).sort();
  files.forEach(file => {
    console.log('Adding test file:', file);
    __tests__.addFile(file);
  });
  __tests__.run();
}
else  {
  require(process.argv[2]);
}
