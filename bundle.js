#!./bin/run.js

import {writeFileSync} from 'fs';
import {uniq} from 'lodash';
import package_json from 'package.json';
import package_lock_json from 'package-lock.json';
import {spawn} from 'child_process';

const recurse = doc => {
  for (const [key, value] of Object.entries(doc)) {
    if (key === 'dependencies') {
      return Object.keys(value).concat(recurse(value));
    }
  }
  return [];
};

const skipped = ['fsevents', 'node-sass'];

const deps = uniq(recurse(package_lock_json)).filter(f => skipped.indexOf(f) === -1);
package_json.bundledDependencies = deps;
writeFileSync('package.json', JSON.stringify(package_json, null, 2));

spawn('npm', ['pack'], {stdio: 'inherit'});
