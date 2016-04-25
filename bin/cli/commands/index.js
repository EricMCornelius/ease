'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.run = exports.print = undefined;

var _print = require('./print');

var print = _interopRequireWildcard(_print);

var _run = require('./run');

var run = _interopRequireWildcard(_run);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

exports.print = print;
exports.run = run;