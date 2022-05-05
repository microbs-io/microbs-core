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

// Global context object
const context = {}

/**
* Get a value from the context object at a given path (i.e. dotted key),
* or get the entire context object if no path is given.
*/
const get = (path) => {
  if (path)
    return _.cloneDeep(_.get(context, path))
  return _.cloneDeep(context)
}

/**
 * Set a value in the context object at a path (i.e. dotted key), but only if
 * the key doesn't already exist. Disallow setting an undefined value, which
 * would delete the key.
 */
const set = (path, value) => {
  var success
  if (value === undefined) {
    throw new Error('context.set() does not allow undefined values.')
  } else if (_.get(context, path)) {
    success = false
  } else {
    _.set(context, path, value)
    success = true
  }
  return success
}

// Export context
module.exports = {
  get: get,
  set: set
}
