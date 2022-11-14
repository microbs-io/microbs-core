/*
 * state.test.js
 *
 * Unit tests for ./src/state.js
 */

// Third-party packages
const _ = require('lodash')

// Standard packages
const fs = require('fs')

// Test packages
const utils = require('./utils')

describe('state', () => {
  
  // Reset stateful data for each test
  let config
  let context
  let state
  beforeEach(() => {
    jest.isolateModules(() => {
      config = require('../src/config')
      context = require('../src/context')
      state = require('../src/state')
          
      // Prepare context object
      context.set('path.user', './test/tmp')
      context.set('path.config', './test/config/generic-flat.yaml')
      context.set('path.state', './test/tmp/state.yaml')
      context.set('path.env', './test/tmp/.env')
      
      // Create tmp directory
      if (fs.existsSync(context.get('path.user')))
        fs.rmSync(context.get('path.user'), { recursive: true, force: true })
      fs.mkdirSync(context.get('path.user'))
    })
  })
  
  afterEach(() => {
    // Remove tmp directory
    if (fs.existsSync(context.get('path.user')))
      fs.rmSync(context.get('path.user'), { recursive: true, force: true })
  })
  
  /**
   * Test if the state object is correctly parsed from a state file.
   */
  test('state.load() [generic.yaml]', () => {
    const s = state.load('./test/state/generic.yaml')
    expect(_.get(s, 'deployment.name')).toBe('test')
    expect(_.get(s, 'deployment.app')).toBe('templates')
    expect(_.get(s, 'deployment.plugins.alerts')).toBe('template')
    expect(_.get(s, 'deployment.plugins.k8s')).toBe('template')
    expect(_.get(s, 'deployment.plugins.obs')).toBe('template')
    expect(_.get(s, 'deployment.environment')).toBe('test')
    expect(_.get(s, 'docker.registry')).toBeUndefined()
    expect(_.get(s, 'otlp.receiver.host')).toBe('otel-collector')
    expect(_.get(s, 'otlp.receiver.port')).toBe(4317)
  })
  
  /**
   * Test if the state object is correctly persisted as a singleton object
   * after being loaded from a state file.
   * 
   * Expect the deployment.name in state.yaml ("test") to be overridden
   * by the deployment.name in config.yaml ("test-flat").
   */
  test('state.init()', () => {
    state.init('./test/state/generic.yaml')
    expect(state.get('deployment.name')).toBe('test-flat')
    expect(state.get('deployment.app')).toBe('templates')
    expect(state.get('deployment.plugins.alerts')).toBe('template')
    expect(state.get('deployment.plugins.k8s')).toBe('template')
    expect(state.get('deployment.plugins.obs')).toBe('template')
    expect(state.get('deployment.environment')).toBe('test')
    expect(state.get('docker.registry')).toBeUndefined()
    expect(state.get('otlp.receiver.host')).toBe('otel-collector')
    expect(state.get('otlp.receiver.port')).toBe(4317)
  })
  
  // Test creation of non-existing state file
  test('state.init() ensure state.yaml is created', () => {
    const filepath = './test/tmp/state.yaml'
    config.init('./test/config/empty.yaml')
    state.init(filepath, './test/tmp/config.yaml')
    expect(state.get()).toEqual({})
  })
  
  /**
   * Test if the state object can be modified with state.set() and then
   * persisted to state.yaml.
   */
  test('state.save()', () => {
    state.init()
    config.init('./test/config/generic-flat.yaml')
    state.set('foo.bar', 'baz') // Add a field
    state.set('docker.registry', 'test') // Modify a field
    state.set('deployment.environment', undefined) // Delete a field
    state.save()
    expect(state.get('deployment.name')).toBe('test-flat')
    expect(state.get('deployment.app')).toBe('templates')
    expect(state.get('deployment.plugins.alerts')).toBe('template')
    expect(state.get('deployment.plugins.k8s')).toBe('template')
    expect(state.get('deployment.plugins.obs')).toBe('template')
    expect(state.get('deployment.environment')).toBeUndefined()
    expect(state.get('docker.registry')).toBe('test')
    expect(state.get('foo.bar')).toBe('baz')
    expect(state.get('otlp.receiver.host')).toBe('otel-collector')
    expect(state.get('otlp.receiver.port')).toBe(4317)
  })
})
