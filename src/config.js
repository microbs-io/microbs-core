/*
 * config.js
 *
 * Parses the config.yaml configuration file, stores its values in memory,
 * and provides read-only access to those values.
 */

// Standard packages
const fs = require('fs')
const path = require('path')

// Third-party packages
const _ = require('lodash')
const yaml = require('js-yaml')

// Main packages
const context = require('./context')
const logger = require('./logger')
const utils = require('./utils')

// Global config object
const config = {}

const pathConfig = (filepath) => filepath || context.get('path.config') || path.join(process.cwd(), 'config.yaml') || path.join(os.homedir(), '.microbs', 'config.yaml')

/**
 * Read config file.
 */
const read = (filepath) => {
  filepath = pathConfig(filepath)
  return fs.readFileSync(filepath, 'utf8')
}

/**
 * Parse the contents of a config file to a YAML object, and then flatten the
 * structure of the object.
 */
const parse = (contents) => utils.flatten(yaml.load(contents || '{}'))

/**
 * Read and parse the config file.
 */
const load = (filepath) => parse(read(filepath))

/**
 * Load the config file and persist it in an immutable config object.
 */
const init = (filepath) => {

  // Return the existing config object if it exists.
  if (Object.isFrozen(config))
    return config

  // Read, parse, and persist the config.
  for (const [key, value] of Object.entries(load(filepath)))
    config[key] = value

  // Make the config object immutable and then return it.
  return Object.freeze(config)
}

/**
 * Get a value from the config object at a given path (i.e. dotted key),
 * or get the entire config object if no path is given.
 */
const get = (path) => path ? _.get(init(), path) : init()

// Export config
module.exports = {
  get: get,
  init: init,
  load: load,
  parse: parse,
  read: read
}
