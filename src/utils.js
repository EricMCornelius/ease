import Logger from './logger';

import {readFileSync, existsSync} from 'fs';
import {resolve, dirname, basename, split} from 'path';
import {set, isString, isArray, isFunction, defaultsDeep} from 'lodash';

import {find} from 'shelljs';
import Cache from './cache';

const log = new Logger({level: process.env.LOG_LEVEL || 'info'});

global.log = log;

const cache_dir = resolve('.ease_cache');

const get_cache = () => new Cache({dir: cache_dir});

const get_packages = dir => find(dir)
  .filter(file => /package\.json$/.test(file));

const get_ease_deps = dir => get_packages(dir)
  .reduce((agg, file) => {
    const dir = dirname(file);
    const dep = basename(dir);
    if (dep.indexOf('webpack') === -1 && dep.indexOf('babel') === -1 && dep.indexOf('source-map-support') === -1) {
      return agg;
    }
    agg[dep] = dir;
    return agg;
  }, {});

const ease_dep_dir = resolve(__dirname, '../node_modules');

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
  project_package = readFileSync('package.json');
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
    .reduce((agg, parts) => set(agg, parts, {}), {});
  cache.put(project_deps_key, project_dep_trie);
}

const matching_prefixes_impl = (node, path, curr = [], results = []) => {
  if (path.length === 0) {
    return results;
  }

  const next = path.shift();
  const lookup = node[next];
  curr = curr.concat(next);

  return lookup ?
    matching_prefixes_impl(lookup, path, curr, lookup['package.json'] ? results.concat(curr.join('/')) : results) :
    results;
};

const matching_prefixes = path => matching_prefixes_impl(project_dep_trie, path.split('/')).reverse();

const formatter = (percentage, message) => {
  const formatted = `${(100.0 * percentage).toFixed(1)}%: ${message}`;
  if (isFunction(process.stdout.clearLine)) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(formatted);
  }
  else {
    log.info(formatted);
  }
};

let babel_opts = {};
const babel_default_opts = {
  babelrc: false,
  presets: ['@babel/preset-env', '@babel/preset-react'],
  plugins: ['@babel/plugin-proposal-class-properties']
};

let mocha_opts = {};
const mocha_default_opts = {
  timeout: 20000,
  reporter: 'jenkins',
  reporterOptions: {
    junit_report_name: 'tests',
    junit_report_path: 'reports/tests/report.xml',
    junit_report_stack: 1
  }
};

let eslint_opts = {};

let eslint_default_opts = {
  'env': {
    'node': true
  },
  'extends': 'eslint:recommended',
  'parser': 'babel-eslint',
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
    'arrow-parens': [2, 'as-needed'],
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
    'quotes': [2, 'single', { 'allowTemplateLiterals': true } ],
    'indent': [2, 2, {'SwitchCase': 1}],
    'brace-style': [2, 'stroustrup', { 'allowSingleLine': true }],
    'camelcase': 0
  }
};

// set the default opts to the .eslintrc contents if they exist, otherwise use ease defaults
try {
  const root_eslint_file = resolve(process.cwd(), '.eslintrc');
  eslint_default_opts = JSON.parse(readFileSync(root_eslint_file));
}
catch(err) {

}

let webpack_opts = {};
let webpack_default_opts = {
  mode: 'production'
};

let coverage_opts = {};
let coverage_default_opts = {};

// set the default opts to the webpack.config.js
try {
  const webpack_file = resolve(process.cwd(), 'webpack.config.js');
  if (existsSync(webpack_file)) {
    webpack_default_opts = require(webpack_file);
  }
}
catch(err) {
  log.error(err.stack);
}

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

// merge config from the .ease_config file
try {
  const config_file = resolve(process.cwd(), process.env.EASE_CONFIG || '.ease_config');
  const config = require(config_file);
  defaultsDeep(eslint_opts, config.eslint, eslint_default_opts);
  defaultsDeep(mocha_opts, config.mocha, mocha_default_opts);
  defaultsDeep(webpack_opts, config.webpack, webpack_default_opts);
  defaultsDeep(coverage_opts, config.coverage, coverage_default_opts);

  const {override = false, targets, ...config_babel_opts} = (config.babel || {});
  if (override) {
    babel_opts = config_babel_opts;
  }
  else if (targets) {
    // if targets are provided, set up babel env preset
    defaultsDeep(config_babel_opts, babel_default_opts);

    const {plugins = [], presets = [], ...rest} = config_babel_opts;

    babel_opts = {
      presets: [['@babel/preset-env', {targets, debug: true}], ...presets.filter(name => name !== '@babel/preset-env')],
      plugins,
      ...rest
    };
  }
  else {
    defaultsDeep(babel_opts, config.babel, babel_default_opts);
  }

  if (config.transform_filter) {
    standard_transformer_filter = file => {
      if (/ease\/node_modules/.test(file) || /ease\\node_modules/.test(file)) {
        return false;
      }
      return config.transform_filter(file);
    }
  }

  if (config.log_level) {
    log.level = config.log_level;
  }
}
catch(err) {
  log.error(err.stack);
  eslint_opts = eslint_default_opts;
  babel_opts = babel_default_opts;
}

const resolve_babel_dep = type => plugin => {
  let plugin_name = null;
  let plugin_args = [];

  if (isString(plugin)) {
    plugin_name = plugin;
  }
  else if (isArray(plugin)) {
    const [name, ...args] = plugin;
    plugin_name = name;
    plugin_args = args;
  }
  else {
    return plugin;
  }

  const prefixed = plugin_name.startsWith(`babel-${type}`) || plugin_name.startsWith(`@babel/${type}-`) ? plugin_name : `babel-${type}-${plugin_name}`;
  const plugin_path = resolve(__dirname, '../node_modules', prefixed);
  if (existsSync(plugin_path)) {
    return [plugin_path, ...plugin_args];
  }

  return plugin;
};

const resolve_babel_plugin = resolve_babel_dep('plugin');
const resolve_babel_preset = resolve_babel_dep('preset');

babel_opts.plugins = babel_opts.plugins.map(resolve_babel_plugin);
babel_opts.presets = babel_opts.presets.map(resolve_babel_preset);

export {
  formatter,
  babel_opts,
  coverage_opts,
  eslint_opts,
  mocha_opts,
  webpack_opts,
  standard_transformer,
  standard_transformer_filter,
  standard_resolver,
  cache,
  log,
  resolve_babel_plugin,
  resolve_babel_preset
}
