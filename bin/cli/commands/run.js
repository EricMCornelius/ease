'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
const command = 'run';

const describe = 'Run a script';

const builder = {
  include: {
    description: 'Include files matching this pattern',
    type: 'string',
    array: true
  }
};

const handler = argv => {
  log.info(argv);
};

exports.command = command;
exports.describe = describe;
exports.builder = builder;
exports.handler = handler;