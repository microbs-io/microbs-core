// Third-party packages
const quote = require('shell-quote').quote

// Main packages
const config = require('./config')
const logger = require('./logger')
const state = require('./state')
const utils = require('./utils')

/**
 * Recreate microbs-secrets and then apply a skaffold profile.
 */
module.exports = async (opts) => {
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
  utils.exec(`kubectl delete secret microbs-secrets --namespace=${quote([ opts.namespace ])}`, true)

  // Save .state
  state.save()

  // Turn .state into .env for microbs-secrets
  logger.debug(`...staging new microbs-secrets at ${process.cwd()}/.env`)
  const envFilepath = `${process.cwd()}/.env`
  utils.createEnvFile(state.get(), envFilepath)

  logger.debug('...deploying new microbs-secrets to Kubernetes...')
  utils.exec(`kubectl create secret generic microbs-secrets --from-env-file='${quote([ envFilepath ])}' --namespace=${quote([ opts.namespace ])}`, true)
  logger.info('...done.')

  logger.info('')
  logger.info(`Rolling out the '${opts.profile}' profile with skaffold...`)
  logger.info('')
  var command = `VARIANT=${quote([ opts.profile ])} skaffold ${quote([ opts.action ])} -p "${quote([ opts.profile ])}" -f "${quote([ opts.skaffoldFilepath ])}"`
  if (opts.action == 'run')
    command = `${command} -l "skaffold.dev/run-id=microbs-${quote([ config.get('deployment.name') ])}" --status-check=false`
  if (config.get('docker.registry'))
    command = `${command} --default-repo="${quote([ config.get('docker.registry') ])}"`
  const result = utils.exec(command)
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
