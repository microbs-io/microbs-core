/*
 * state.js
 *
 * Parses state.yaml, stores its values in memory, and provides read-write
 * access to those values.
 */

// Standard packages
const fs = require('fs')
const os = require('os')
const path = require('path')

// Third-party packages
const _ = require('lodash')
const yaml = require('js-yaml')

// Main packages
const config = require('./config')
const context = require('./context')
const logger = require('./logger')
const utils = require('./utils')

// Global state object
const state = {}

/**
 * Resolve and get the path to the state file.
 * Order of precedence:
 *  
 *  1. If the function has the filepath argument, use that.
 *  2. Else, if the context object has 'path.state', use that.
 *  3. Else, if the user's current working directory has state.yaml, use that.
 *  4. Else, if the user's home directory has state.yaml, use that.
 *  5. Else, if nothing matches, return undefined.
 *
 * The most common usages above are:
 *
 *  - The user runs the CLI with the default state path, which is option (4),
 *    which then persists in the context object as 'path.state', which is (2).
 *  - The user runs the CLI with the current directory as the state path,
 *    which is option (3), which then persists in the context object as
 *    'path.state', which is (2).
 *  - The user runs the CLI with a custom directory as the state path,
 *    which then persists in the context object as 'path.state', which is (2).
 *  - Least commonly, (1) is used mainly for testing purposes.
 */
const pathState = (filepath) => {
  if (filepath)
    return filepath
  else if (context.get('path.state'))
    return context.get('path.state')
  else if (fs.existsSync(path.join(process.cwd(), 'state.yaml')))
    return path.join(process.cwd(), 'state.yaml')
  else if (fs.existsSync(path.join(os.homedir(), '.microbs', 'state.yaml')))
    return path.join(os.homedir(), '.microbs', 'state.yaml')
}

const ensureExists = (filepath) => {
  filepathResolved = pathState(filepath)
  if (!fs.existsSync(filepathResolved))
    fs.closeSync(fs.openSync(filepathResolved, 'w'))
}

/**
 * Read state.yaml
 */
const read = (filepath) => {
  filepathResolved = pathState(filepath)
  ensureExists(filepathResolved)
  return fs.readFileSync(filepathResolved, 'utf8')
}

/**
 * Parse the contents of state.yaml to a YAML object, and then flatten the
 * structure of the object. Normally state.yaml would already be flattened,
 * but it's possible for a user to add nested fields to the file directly.
 */
const parse = (contents) => utils.flatten(yaml.load(contents || '{}'))

/**
 * Read and parse state.yaml.
 */
const load = (filepath) => parse(read(filepath))

/**
 * Load state.yaml and persist it in a mutable state object.
 * Merge config into state.yaml, overriding state.yaml with config.
 */
const init = (filepath) => {
  for (var key in state)
    delete state[key]
  for (const [key, value] of Object.entries(_.merge(load(filepath), config.get())))
    state[key] = value
  return state
}

/**
 * Persist the state object to the state.yaml file.
 */
const save = (filepath) => {
  if (_.isEmpty(state))
    init()
  filepath = pathState(filepath)

  // Save state.yaml file
  fs.writeFileSync(
    filepath,
    yaml.dump(utils.flatten(state), { sortKeys: true }),
    'utf8',
    (err) => logger.error(err)
  )
}

/**
 * Get a value from the state object at a given path (i.e. dotted key),
 * or get the entire state object if no path is given.
 */
const get = (path) => {
  if (_.isEmpty(state))
    init()
  return path ? _.get(state, path) : state
}

/**
 * Set a value in the state object at a given path (i.e. dotted key).
 */
const set = (path, value) => {
  if (_.isEmpty(state))
    init()
  _.set(state, path, value)
}

// Export state
module.exports = {
  get: get,
  set: set,
  init: init,
  load: load,
  parse: parse,
  read: read,
  save: save
}
