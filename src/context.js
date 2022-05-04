/*
 * context.js
 *
 * Stores information about the command execution context. This includes the
 * command, arguments, and paths to the config file and the microbs project home
 * directory and the config file.
 * 
 * Context data is stored in a global object called context, the values of which
 * are immutable once created.
 */

// Third-party packages
const _ = require('lodash')

// Main packages
const { logger } = require('./logger')

// Global context object
const context = {}

/**
* Get a value from the context object at a given path (i.e. dotted key),
* or get the entire context object if no path is given.
*/
const get = (path) => path ? _.cloneDeep(_.get(context, path)) : _.cloneDeep(context)

/**
 * Set a value by a key, but only if the key doesn't already exist.
 */
const set = (key, value) => {
  var success
  if (key in context) {
    logger.warn(`"${key}" has already been set in the context object and cannot be set again.`)
    success = false
  } else {
    context[key] = value
    success = true
  }
  return success
}

// Export context
module.exports = {
  get: get,
  set: set
}
