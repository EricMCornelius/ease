import {readFileSync} from 'fs';

const package_info = JSON.parse(readFileSync('package.json'));
console.log(package_info.version);
