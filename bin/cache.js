'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class FileCache {
  constructor(args) {
    this.dir = args.dir;
    (0, _mkdirp2.default)(args.dir);
  }

  get(key) {
    let full_key = _path2.default.resolve(this.dir, key);
    return JSON.parse(_fs2.default.readFileSync(full_key));
  }

  put(key, content) {
    let full_key = _path2.default.resolve(this.dir, key);
    _fs2.default.writeFileSync(full_key, JSON.stringify(content));
  }

  hash(data) {
    return _crypto2.default.createHash('sha256').update(data, 'utf8').digest('hex');
  }
};

exports.default = FileCache;