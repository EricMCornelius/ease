"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _module2 = _interopRequireDefault(require("module"));

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const _compile = _module2.default.prototype._compile;
const _resolve = _module2.default._resolveFilename;

var _default = (transformer, resolver) => {
  _module2.default._resolveFilename = function (request_, parent_) {
    const {
      request,
      parent
    } = resolver(request_, parent_);

    try {
      return _resolve(request || request_, parent || parent_);
    } catch (err) {}

    try {
      return _resolve(_path.default.resolve(request || request_), parent || parent_);
    } catch (err) {}

    try {
      return _resolve(_path.default.resolve(request || request_, 'index.js'), parent || parent_);
    } catch (err) {}

    throw new Error(`Unable to resolve / could not find import: ${request || request_}`);
  };

  _module2.default.prototype._compile = function (content, filename) {
    return _compile.bind(this)(transformer(content, filename), filename);
  };
};

exports.default = _default;