import module from 'module';
import path from 'path';

let _compile = module.prototype._compile;
let _resolve = module._resolveFilename;

export default (transformer, resolver) => {
  module._resolveFilename = function(request, parent) {
    request = resolver(request, parent);
    return _resolve(request, parent);
  }

  module.prototype._compile = function(content, filename) {
    return _compile.bind(this)(transformer(content, filename), filename);
  }
};
