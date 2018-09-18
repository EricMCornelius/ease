"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.handler = exports.builder = exports.describe = exports.command = void 0;
const command = 'run';
exports.command = command;
const describe = 'Run a script';
exports.describe = describe;
const builder = {
  include: {
    description: 'Include files matching this pattern',
    type: 'string',
    array: true
  }
};
exports.builder = builder;

const handler = argv => {
  log.info(argv);
};

exports.handler = handler;