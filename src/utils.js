import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import log from 'winston';

import {find} from 'shelljs';
import Cache from './cache';

let cache_dir = path.resolve('.ease_cache');

const get_cache = () => new Cache({dir: cache_dir});

const get_packages = dir => find(dir)
  .filter(file => /package\.json$/.test(file));

const get_ease_deps = dir => get_packages(dir)
  .reduce((agg, file) => {
    let dir = path.dirname(file);
    let dep = path.basename(dir);
    if (dep.indexOf('webpack') === -1 && dep.indexOf('babel') === -1 && dep.indexOf('source-map-support') === -1) {
      return agg;
    }
    agg[dep] = dir;
    return agg;
  }, {});

let ease_dep_dir = path.resolve(__dirname, '../node_modules');

const cache = get_cache();

let ease_deps = null;
try {
  ease_deps = cache.get('.ease_deps');
}
catch (err) {
  ease_deps = get_ease_deps(ease_dep_dir);
  cache.put('.ease_deps', ease_deps);
}

let project_package = '';
try {
  project_package = fs.readFileSync('package.json');
}
catch (err) {

}

let project_dep_trie = null;
const project_deps_key = `${cache.hash(project_package)}.deps`;
try {
  project_dep_trie = cache.get(project_deps_key);
}
catch (err) {
  project_dep_trie = get_packages(process.cwd())
    .map(dep => dep.split('/'))
    .reduce((agg, parts) => _.set(agg, parts, {}), {}); 
  cache.put(project_deps_key, project_dep_trie);
}

let matching_prefixes_impl = (node, path, curr = [], results = []) => {
  if (path.length === 0) {
    return results;
  }

  let next = path.shift();
  let lookup = node[next];
  curr = curr.concat(next);

  return lookup ?
    matching_prefixes_impl(lookup, path, curr, lookup['package.json'] ? results.concat(curr.join('/')) : results) :
    results;
};

let matching_prefixes = path => matching_prefixes_impl(project_dep_trie, path.split('/')).reverse();

const formatter = (percentage, message) => {
  const formatted = `${(100.0 * percentage).toFixed(1)}%: ${message}`;
  if (_.isFunction(process.stdout.clearLine)) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(formatted);
  }
  else {
    console.log(formatted);
  }
};

let babel_opts = {};
const babel_default_opts = {
  babelrc: false,
  presets: ['es2015', 'react', 'stage-2'],
  plugins: ['syntax-decorators', 'transform-decorators-legacy']
};

let eslint_opts = {};
const eslint_default_opts = {
  'parser': 'babel-eslint',
  'env': {
    'node': true
  },
  'extends': 'eslint:recommended',
  'rules': {
    'strict': 0,
    'semi': [2, 'always'],
    'semi-spacing': [2, {'before': false, 'after': true}],
    'arrow-spacing': [2, {'before': true, 'after': true}],
    'key-spacing': [2, {'beforeColon': false, 'afterColon': true}],
    'keyword-spacing': [2, {'before': true, 'after': true, 'overrides': {'catch': {'after': false}}}],
    'max-depth': [2, {max: 4}],
    'max-nested-callbacks': [2, {max: 3}],
    'quote-props': [2, 'as-needed'],
    'no-trailing-spaces': [2, {'skipBlankLines': true}],
    'no-var': 2,
    'arrow-body-style': [2, 'as-needed'],
    'babel/arrow-parens': [2, 'as-needed'],
    'constructor-super': 2,
    'no-console': 2,
    'no-debugger': 2,
    'no-empty': 2,
    'no-extra-parens': 2,
    'no-extra-semi': 2,
    'no-control-regex': 2,
    'no-empty-character-class': 2,
    'no-ex-assign': 2,
    'no-constant-condition': 2,
    'no-class-assign': 2,
    'no-cond-assign': 2,
    'no-const-assign': 2,
    'no-dupe-class-members': 2,
    'no-dupe-args': 2,
    'no-dupe-keys': 2,
    'no-duplicate-case': 2,
    'comma-dangle': [2, 'never'],
    'no-useless-constructor': 2,
    'no-this-before-super': 2,
    'no-duplicate-imports': 2,
    'object-shorthand': [2, 'always'],
    'prefer-arrow-callback': 2,
    'prefer-template': 2,
    'prefer-spread': 2,
    'prefer-const': 2,
    'prefer-rest-params': 2,
    'quotes': [2, 'single'],
    'indent': [2, 2, {'SwitchCase': 1}],
    'brace-style': [2, 'stroustrup', { 'allowSingleLine': true }],
    'camelcase': 0
  },
  'plugins': [
    'babel'
  ]
};

let standard_transformer = (content, filename) => content;

let standard_transformer_filter = filename => filename.indexOf('node_modules') === -1;

let standard_resolver = (request, parent) => {
  log.debug(`Resolving ${request} in ${parent.id}`);

  if (ease_deps[request]) return {request: ease_deps[request]};
  if (!parent.id.startsWith(process.cwd())) return {request, parent};

  const prefixes = matching_prefixes(parent.id);
  parent.paths = prefixes.concat(parent.paths);
  return {
    parent,
    request
  };
}

let config = {};

try {
  const config_file = path.resolve(process.cwd(), '.ease_config');
  const config = require(config_file);
  _.defaultsDeep(eslint_opts, config.eslint, eslint_default_opts);
  _.defaultsDeep(babel_opts, config.babel, babel_default_opts);

  if (config.transform_filter) {
    standard_transformer_filter = config.transform_filter;
  }

  if (config.log_level) {
    log.level = config.log_level;
  }
}
catch(err) {
  eslint_opts = eslint_default_opts;
  babel_opts = babel_default_opts;
}

export {
  formatter,
  babel_opts,
  eslint_opts,
  standard_transformer,
  standard_transformer_filter,
  standard_resolver,
  cache,
  log
}
