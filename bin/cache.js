"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _crypto = _interopRequireDefault(require("crypto"));

var _mkdirp = _interopRequireDefault(require("mkdirp"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class FileCache {
  constructor(args) {
    this.dir = args.dir;
    (0, _mkdirp.default)(args.dir);
  }

  get(key) {
    let full_key = _path.default.resolve(this.dir, key);

    return JSON.parse(_fs.default.readFileSync(full_key));
  }

  put(key, content) {
    let full_key = _path.default.resolve(this.dir, key);

    _fs.default.writeFileSync(full_key, JSON.stringify(content));
  }

  hash(data) {
    return _crypto.default.createHash('sha256').update(data, 'utf8').digest('hex');
  }

}

;
var _default = FileCache;
exports.default = _default;