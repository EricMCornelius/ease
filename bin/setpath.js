"use strict";

var _module2 = _interopRequireDefault(require("module"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

global.__rootpath__ = process.cwd();
process.env.NODE_PATH = `${__rootpath__}:${__dirname}/../`;

_module2.default.Module._initPaths();