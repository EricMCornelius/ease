"use strict";

var _yargs = _interopRequireDefault(require("yargs"));

var commands = _interopRequireWildcard(require("./commands"));

var _polyfill = _interopRequireDefault(require("@babel/polyfill"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

Object.entries(commands).map(([name, cmd]) => _yargs.default.command(cmd));
_yargs.default.help().argv;