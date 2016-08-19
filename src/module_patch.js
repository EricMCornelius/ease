import module from 'module';
import path from 'path';

const _compile = module.prototype._compile;
const _resolve = module._resolveFilename;

export default (transformer, resolver) => {
  module._resolveFilename = function(request_, parent_) {
    const {request, parent} = resolver(request_, parent_);
    try {
      return _resolve(request || request_, parent || parent_);
    }
    catch(err) { }
    try {
      return _resolve(path.resolve(request || request_), parent || parent_);
    }
    catch(err) { }
    try {
      return _resolve(path.resolve(request || request_, 'index.js'), parent || parent_);
    }
    catch(err) { }
    throw new Error(`Unable to resolve / could not find import: ${request || request_}`);
  }

  module.prototype._compile = function(content, filename) {
    return _compile.bind(this)(transformer(content, filename), filename);
  }
};
