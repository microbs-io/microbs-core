/*
 * utils.js
 *
 * Common utility functions.
 */

// Standard packages
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Third-party packages
const _ = require('lodash')
const axios = require('axios')
const quote = require('shell-quote').quote

// Main packages
const config = require('./logger')
const logger = require('./logger')
const state = require('./state')

// Regular expressions
RE_EXPAND_VARS = new RegExp(/\${([^}]*)}/g)

/**
 * Expand environment variables in a string like Bash (e.g. $VARIABLE).
 */
module.exports.expandvars = (str, values) => {
  return str.replace(RE_EXPAND_VARS, (r, k) => _.get(values, k))
}

/**
 * Read a file.
 */
module.exports.loadFile = (filepath) => {
  return fs.readFileSync(filepath, 'utf8')
}

/**
 * Read a file and populate its variables
 */
module.exports.loadTemplate = (filepath, values) => {
  return module.exports.expandvars(module.exports.loadFile(filepath).trim(), values)
}

/**
 * Read a file containing a JSON template, populate its variables,
 * and convert it to a JSON object.
 */
module.exports.loadTemplateJson = (filepath, values) => {
  return JSON.parse(module.exports.loadTemplate(filepath, values))
}

/**
 * Read a file and convert it to a JSON object without populating any variables.
 */
module.exports.loadJson = (filepath) => {
  return JSON.parse(module.exports.loadFile(filepath).trim())
}

/**
 * Sleep for a given number of milliseconds.
 */
module.exports.sleep = (ms) => {
  return new Promise(r => setTimeout(r, ms))
}

/**
 * Execute a shell command.
 *
 * For security purposes, be sure to use require('shell-quote').quote() to
 * sanitize any inputs to the command variable prior to running this function.
 */
module.exports.exec = (command, hideStdout) => {
  try {
    const stdout = execSync(command, hideStdout ? { stdio: 'pipe' } : { stdio: 'inherit' })
    return {
      code: 0,
      stdout: (stdout || '').toString()
    }
  } catch (err) {
    return {
      code: err.code,
      stderr: (err.stderr || '').toString(),
      stdout: (err.stdout || '').toString(),
      err: err
    }
  }
}

/**
 * Convert a nested object to a flattened object.
 *
 * Before: { 'a': { 'b': { 'c.d': 'foo' }}}
 * After: { 'a.b.c.d': 'foo' }
 */
module.exports.flatten = (obj) => {
	const objNew = {}
	for (var key in obj) {
		if (!obj.hasOwnProperty(key))
      continue
		if ((typeof obj[key]) == 'object') {
			const objFlat = module.exports.flatten(obj[key])
			for (var key2 in objFlat) {
				if (!objFlat.hasOwnProperty(key2))
          continue
				objNew[key + '.' + key2] = objFlat[key2]
			}
		} else {
			objNew[key] = obj[key]
		}
	}
	return objNew
}

/**
 * Flatten a nested object, convert its keys to environment variable names,
 * and merge the key-value pairs into an .env file syntax.
 */
module.exports.objToEnv = (obj) => {
  const objFlat = module.exports.flatten(obj)
  const env = []
  for (var key in objFlat)
    env.push(`${key.toUpperCase().split('.').join('_')}=${objFlat[key]}`)
  return env.join('\n')
}

/**
 * Create a temporary .env file holding secrets to be deployed to Kubernetes.
 */
module.exports.createEnvFile = (obj, outPath) => {
  const env = module.exports.objToEnv(obj)
  fs.writeFileSync(outPath, env)
}

/**
 * Validate whether config.yaml has values for the given fields.
 */
module.exports.configHas = (fields) => {
  for (var i in fields)
    if (!require('./config').get(fields[i]))
      return false
  return true
}

/**
 * Submit an http request. Handle debug and error logging.
 */
module.exports.http = async (opts) => {
  logger.debug(`${opts.method.toUpperCase()} ${opts.url}`)
  const response = await axios.request({
    method: opts.method,
    url: opts.url,
    data: opts.data || undefined,
    headers: opts.headers || undefined,
    timeout: opts.timeout || 60000,
    validateStatus: () => true
  })
  logger.debug(response.status)
  logger.debug(response.data)
  return response
}

/**
 * Recreate microbs-secrets and then apply a skaffold profile.
 */
module.exports.rollout = async (opts) => {
  var opts = opts || {}
  if (!opts.action)
    opts.action = 'run'
  if (!opts.namespace)
    opts.namespace = 'default'
  if (!opts.profile)
    opts.profile = 'main'
  
  // Validate
  if (!opts.action == 'run' && !opts.action == 'delete')
    throw new Error('opts.action must be either "run" or "delete"')
  if (!opts.skaffoldFilepath)
    throw new Error('opts.skaffoldFilepath must be given')

  // Recreate microbs-secrets
  logger.info('')
  logger.info('Recreating microbs-secrets on Kubernetes...')
  logger.debug('...removing old microbs-secrets from Kubernetes...')
  module.exports.exec(`kubectl delete secret microbs-secrets --namespace=${quote([ opts.namespace ])}`, true)

  // Save .state
  state.save()

  // Turn .state into .env for microbs-secrets
  logger.debug(`...staging new microbs-secrets at ${process.cwd()}/.env`)
  const envFilepath = `${process.cwd()}/.env`
  module.exports.createEnvFile(state.get(), envFilepath)

  logger.debug('...deploying new microbs-secrets to Kubernetes...')
  module.exports.exec(`kubectl create secret generic microbs-secrets --from-env-file='${quote([ envFilepath ])}' --namespace=${quote([ opts.namespace ])}`, true)
  logger.info('...done.')

  logger.info('')
  logger.info(`Rolling out the '${opts.profile}' profile with skaffold...`)
  logger.info('')
  var command = `VARIANT=${quote([ opts.profile ])} skaffold ${quote([ opts.action ])} -p "${quote([ opts.profile ])}" -f "${quote([ opts.skaffoldFilepath ])}"`
  if (opts.action == 'run')
    command = `${command} -l "skaffold.dev/run-id=microbs-${quote([ config.get('deployment.name') ])}" --status-check=false`
  if (config.get('docker.registry'))
    command = `${command} --default-repo="${quote([ config.get('docker.registry') ])}"`
  const result = module.exports.exec(command)
  if (result.err) {
    logger.error('Rollout failed.')
    process.exit(1)
  }

  logger.info('')
  if (opts.action == 'run')
    logger.info('Rollout complete. It might take a moment for changes to take effect.')
  else
    logger.info('Rollout complete.')
}
