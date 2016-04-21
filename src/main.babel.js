#!/usr/bin/env node

import path from 'path';
import fs from 'fs';
import module from 'module';
import vm from 'vm';

import builtins from 'builtins';
import {Collector, Reporter} from 'istanbul';
import {transform} from 'babel-core';

import polyfill from 'babel-polyfill';

let opts = {
  presets: ['es2015', 'stage-2'],
  plugins: ['syntax-decorators', 'transform-decorators-legacy', '__coverage__']
};

let cache = {};

const is_directory = filename => {
  try {
    return fs.lstatSync(filename).isDirectory();
  }
  catch (err) {
    return false;
  }
};

const bootstrap = root => {
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

  return name => {
    if (builtins.indexOf(name) !== -1) {
      return global.__require(name);
    }

    let modulename = path.resolve(root, 'node_modules', name);
    if (is_directory(modulename)) {
      console.log('yep');
      return global.__require(name);
    }

    let filename = path.resolve(root, name);
    if (is_directory(filename)) {
      filename += 'index';
    }

    if (!path.extname(filename)) {
      filename += '.js';
    }

    let _cached = cache[filename];
    if (_cached) {
      return _cached;
    }

    let dirname = path.dirname(filename);
    
    let code = fs.readFileSync(filename).toString();
    opts.filename = filename;
    let transpiled = transform(code, opts).code;

    let _exports = {};
    let _module = {
      exports: _exports
    };
    vm.runInThisContext(module.wrap(transpiled))(_exports, global.require, _module, filename, dirname, process, global);

    cache[filename] = _exports;
    return _exports;
  };
}

let entry = process.argv[2];
let proxied = bootstrap(process.cwd());
global.__require = require;
global.require = proxied;
proxied(entry);

export {
  require
}
  
