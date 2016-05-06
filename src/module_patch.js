import module from 'module';
import path from 'path';

let _compile = module.prototype._compile;
let _resolve = module._resolveFilename;

export default (transformer, resolver) => {
  module._resolveFilename = function(request_, parent_) {
    let {request, parent} = resolver(request_, parent_);
    return _resolve(request || request_, parent || parent_);
  }

  module.prototype._compile = function(content, filename) {
    return _compile.bind(this)(transformer(content, filename), filename);
  }
};
