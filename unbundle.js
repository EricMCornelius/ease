#!./bin/run.js

import {writeFileSync} from 'fs';
import package_json from 'package.json';

const {bundledDependencies, ...package_info} = package_json;

console.log('Removing bundled dependencies');
writeFileSync('package.json', JSON.stringify(package_info, null, 2));
