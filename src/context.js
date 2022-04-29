/*
 * context.js
 *
 * Stores information about the command execution context. This includes the
 * command, arguments, and paths to the config file and the microbs project home
 * directory and the config file.
 */

// Standard packages
const path = require('path')

// Third-party packages
const _ = require('lodash')

// Default context
const DEFAULT_CONTEXT = {
  homepath: process.cwd(),
  filepath: path.join(process.cwd(), 'config.yaml'),
  command: 'help',
  args: { _: [], 'log-level': 'info' }
}

// Global context object
const context = {}

/**
 * Parse command-line arguments and persist them in an immutable context object.
 */
const init = (obj) => {

  // Return the existing context if it exists.
  if (Object.isFrozen(context))
    return context
    
  // Initialize the context object.
  for (var key in DEFAULT_CONTEXT)
    context[key] = DEFAULT_CONTEXT[key]
    
  // Apply the given object to the context object.
  for (const key in obj)
    context[key] = obj[key]
    
  // Make the context object immutable and then return it.
  return Object.freeze(context)
}

// Export context
module.exports = {
  default: () => _.cloneDeep(DEFAULT_CONTEXT),
  get: (key) => key ? init()[key] : init(),
  init: init
}
