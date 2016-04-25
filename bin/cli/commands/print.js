'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var command = 'print';

var describe = 'Print a message';

var builder = {
  vals: {
    description: 'values',
    type: 'number',
    array: true
  }
};

var handler = function handler(argv) {
  console.log(argv);
};

exports.command = command;
exports.describe = describe;
exports.builder = builder;
exports.handler = handler;