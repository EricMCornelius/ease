import module from 'module';

global.__rootpath__ = process.cwd();
process.env.NODE_PATH = `${__rootpath__}:${__dirname}/../`;
module.Module._initPaths();
