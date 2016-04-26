import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mkdirp from 'mkdirp';

class FileCache {
  constructor(args) {
    this.dir = args.dir;
    mkdirp(args.dir);
  }

  get(key) {
    let full_key = path.resolve(this.dir, key);
    return JSON.parse(fs.readFileSync(full_key));
  }

  put(key, content) {
    let full_key = path.resolve(this.dir, key);
    fs.writeFileSync(full_key, JSON.stringify(content));
  }

  hash(data) {
    return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
  }
};

export default FileCache;
