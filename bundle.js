#!./bin/run.js

import fs from 'fs';

const deps = fs.readdirSync('node_modules');
const package_json = JSON.parse(fs.readFileSync('package.json'));
const ignored = {
  '.bin': true,
  'node-sass': true
};

package_json.bundledDependencies = deps.filter(dep => ignored[dep] === undefined);
fs.writeFileSync('package.json', JSON.stringify(package_json, null, 2));
