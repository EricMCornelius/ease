'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
const command = 'print';

const describe = 'Print a message';

const builder = {
  vals: {
    description: 'values',
    type: 'number',
    array: true
  }
};

const handler = argv => {
  console.log(argv);
};

exports.command = command;
exports.describe = describe;
exports.builder = builder;
exports.handler = handler;