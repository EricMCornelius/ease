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
  console.log(argv);
}

export {
  command,
  describe,
  builder,
  handler
};
