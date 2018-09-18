import yargs from 'yargs';
import * as commands from './commands';

import polyfill from '@babel/polyfill';

Object.entries(commands).map(([name, cmd]) => yargs.command(cmd));

yargs.help().argv;
