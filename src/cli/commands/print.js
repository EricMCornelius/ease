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
}

export {
  command,
  describe,
  builder,
  handler
};
