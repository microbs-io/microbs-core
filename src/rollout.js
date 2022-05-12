// Standard packages
const path = require('path')

// Main packages
const config = require('./config')
const logger = require('./logger')
const state = require('./state')
const utils = require('./utils')

/**
 * Deploy microbs-secrets to Kubernetes.
 */
const deploySecrets = (opts) => {
  const envFilepath = `${process.cwd()}/.env`
  const cmd = `kubectl create secret generic microbs-secrets --from-env-file='${utils.sanitize(envFilepath)}' --namespace=${utils.sanitize(opts.namespace)}`
  const result = utils.exec(cmd, true)
  if (result.err) {
    logger.error('...failed to deploy microbs-secrets:')
    logger.error(result.stderr)
    process.exit(1)
  }
}

/**
 * Stage microbs-secrets.
 */
const stageSecrets = () => {
  
  // Save state.yaml
  state.save()

  // Turn state.yaml into .env for microbs-secrets
  logger.debug(`...staging new microbs-secrets at ${process.cwd()}/.env`)
  const envFilepath = `${process.cwd()}/.env`
  utils.createEnvFile(state.get(), envFilepath)
}

/**
 * Delete microbs-secrets from Kubernetes.
 */
const deleteSecrets = (opts) => {
  const cmd = `kubectl delete secret microbs-secrets --namespace=${utils.sanitize(opts.namespace)}`
  const result = utils.exec(cmd, true)
  if (result.err) {
    if (result.stderr.includes('NotFound')) {
      logger.debug('...microbs-secrets does not exist on Kubernetes.')
    } else {
      logger.error('...failed to delete microbs-secrets:')
      logger.error(result.err)
      process.exit(1)
    }
  }
}

/**
 * Recreate microbs-secrets on Kubernetes by deleting the old microbs-secrets,
 * reconstructing it from state.yaml, and deploying the new microbs-secrets.
 */
const recreateSecrets = (opts) => {
  logger.info('')
  logger.info('Recreating microbs-secrets on Kubernetes...')
  
  // Delete old microbs-secrets from Kubernetes
  logger.debug('...deleting old microbs-secrets from Kubernetes...')
  deleteSecrets(opts)
  
  // Recreate .env file from state.yaml to stage new microbs-secrets
  stageSecrets()
  
  // Deploy new microbs-secrets to Kubernetes
  logger.debug('...deploying new microbs-secrets to Kubernetes...')
  deploySecrets(opts)  
  logger.info('...done.')
}

/**
 * Recreate microbs-secrets and then apply a skaffold profile.
 */
const run = async (opts) => {
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
    
  // Recreate microbs-secrets on Kubernetes
  recreateSecrets(opts)

  logger.info('')
  logger.info(`Rolling out the '${opts.profile}' profile with skaffold...`)
  
  // skaffold treats paths under "deploy.kubectl.manifests" as relative to $PWD,
  // hence this temporary chdir into the directory of the skaffold filepath
  // to ensure those paths are relative to the directory of skaffold.yaml.
  const cwd = process.cwd()
  const pwd = path.dirname(opts.skaffoldFilepath)
  try {
    process.chdir(pwd)
    var command = `VARIANT=${utils.sanitize(opts.profile)} skaffold ${utils.sanitize(opts.action)} -p "${utils.sanitize(opts.profile)}" -f "${utils.sanitize(opts.skaffoldFilepath)}"`
    if (opts.action == 'run')
      command = `${command} -l "skaffold.dev/run-id=microbs-${utils.sanitize(config.get('deployment.name'))}" --status-check=false`
    if (config.get('docker.registry'))
      command = `${command} --default-repo="${utils.sanitize(config.get('docker.registry'))}"`
    const result = utils.exec(command)
    if (result.err) {
      logger.error('Rollout failed.')
      process.chdir(cwd)
      process.exit(1)
    }
  } finally {
    process.chdir(cwd)
  }

  logger.info('')
  if (opts.action == 'run')
    logger.info('Rollout complete. It might take a moment for changes to take effect.')
  else
    logger.info('Rollout complete.')
}

module.exports = {
  deleteSecrets: deleteSecrets,
  deploySecrets: deploySecrets,
  recreateSecrets: recreateSecrets,
  stageSecrets: stageSecrets,
  run: run
}
