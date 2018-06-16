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
}

export {
  command,
  describe,
  builder,
  handler
};
