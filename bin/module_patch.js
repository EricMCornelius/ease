'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _module2 = require('module');

var _module3 = _interopRequireDefault(_module2);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _compile = _module3.default.prototype._compile;
var _resolve = _module3.default._resolveFilename;

exports.default = function (transformer, resolver) {
  _module3.default._resolveFilename = function (request, parent) {
    request = resolver(request, parent);
    return _resolve(request, parent);
  };

  _module3.default.prototype._compile = function (content, filename) {
    return _compile.bind(this)(transformer(content, filename), filename);
  };
};