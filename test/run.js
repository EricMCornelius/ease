import {execSync, spawn} from 'child_process';
import package_info from 'package.json';

const exec_async = ({cmd, args = [], opts = {}}) => new Promise((resolve, reject) => {
  try {
    const proc = spawn(cmd, args, opts);
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', d => stdout += d.toString());
    proc.stderr.on('data', d => stderr += d.toString());
    proc.on('exit', code => resolve({stdout, stderr, code}));
    proc.on('error', error => reject({error}));
  }
  catch(error) {
    reject({error});
  }
});

describe('node run tests', async () => {
  it('should spawn an ease instance that runs the es-next source properly', async () => {
    const args = {
      cmd: 'node',
      args: ['./bin/run.js', 'test/samples/echo.ignored.js']
    };
    const {stdout, stderr, code} = await exec_async(args);
    const version = stdout.trim();
    expect(package_info.version).to.equal(version);
  });
});
