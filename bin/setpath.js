'use strict';

var _module2 = require('module');

var _module3 = _interopRequireDefault(_module2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

global.__rootpath__ = process.cwd();
process.env.NODE_PATH = __rootpath__ + ':' + __dirname + '/../';
_module3.default.Module._initPaths();