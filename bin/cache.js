'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FileCache = function () {
  function FileCache(args) {
    _classCallCheck(this, FileCache);

    this.dir = args.dir;
    (0, _mkdirp2.default)(args.dir);
  }

  _createClass(FileCache, [{
    key: 'get',
    value: function get(key) {
      var full_key = _path2.default.resolve(this.dir, key);
      return JSON.parse(_fs2.default.readFileSync(full_key));
    }
  }, {
    key: 'put',
    value: function put(key, content) {
      var full_key = _path2.default.resolve(this.dir, key);
      _fs2.default.writeFileSync(full_key, JSON.stringify(content));
    }
  }, {
    key: 'hash',
    value: function hash(data) {
      return _crypto2.default.createHash('sha256').update(data, 'utf8').digest('hex');
    }
  }]);

  return FileCache;
}();

;

exports.default = FileCache;