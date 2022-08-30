/*
 * state.js
 *
 * Parses state.yaml, stores its values in memory, and provides read-write
 * access to those values.
 */

// Standard packages
const fs = require('fs')
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
 * Resolve and get the path to the config file.
 */
const pathState = (filepath) => {
  if (filepath && fs.existsSync(filepath))
    return filepath
  else if (context.get('path.state') && fs.existsSync(context.get('path.state')))
    return context.get('path.state')
  else if (path.join(process.cwd(), 'state.yaml') && fs.existsSync(path.join(process.cwd(), 'state.yaml')))
    return path.join(process.cwd(), 'state.yaml')
  else if (path.join(os.homedir(), '.microbs', 'state.yaml') && fs.existsSync(path.join(os.homedir(), '.microbs', 'state.yaml')))
    return path.join(os.homedir(), '.microbs', 'state.yaml')
}

/**
 * Read state.yaml
 */
const read = (filepath) => {
  filepath = pathState(filepath)
  try {
    return fs.readFileSync(filepath, 'utf8')
  } catch (err) {
    if (err.code === 'ENOENT') {
      // state.yaml doesn't exist. Create an empty one.
      fs.closeSync(fs.openSync(filepath, 'w'))
      return fs.readFileSync(filepath, 'utf8')
    } else {
      throw err
    }
  }
}

/**
 * Parse the contents of state.yaml to a YAML object, and then flatten the
 * structure of the object. Normally state.yaml would already be flattened,
 * but it's possible for a user to add nested fields to the file directly.
 */
const parse = (contents) => utils.flatten(yaml.load(contents || '{}'))

/**
 * Read and parse state.yaml.
 * Merge config into state.yaml, overriding state.yaml with config.
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
