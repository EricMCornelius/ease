'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var command = 'run';

var describe = 'Run a script';

var builder = {
  include: {
    description: 'Include files matching this pattern',
    type: 'string',
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