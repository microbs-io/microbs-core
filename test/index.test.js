/*
 * index.test.js
 */

// Standard packages
const path = require('path')

// Main packages
const utils = require('../src/utils')

// Test packages
const testutils = require('./utils')

// Path to main config file for tests
const conf = './test/configs/generic-nested.yaml'

describe('package.json', () => {

  test('package.json exists', () => {
    const json = utils.loadJson(path.join(process.cwd(), 'package.json'))
    expect(json).toBeTruthy()
  })

  test('package.json declares "main"', () => {
    const json = utils.loadJson(path.join(process.cwd(), 'package.json'))
    expect(json.main).toBe('./src/index.js')
  })

  test('package.json declares "license"', () => {
    const json = utils.loadJson(path.join(process.cwd(), 'package.json'))
    expect(json.license).toBe('Apache-2.0')
  })

  test('package.json declares "version"', () => {
    const json = utils.loadJson(path.join(process.cwd(), 'package.json'))
    expect(json.version).toBeTruthy()
  })

  test('package.json declares "url"', () => {
    const json = utils.loadJson(path.join(process.cwd(), 'package.json'))
    expect(json.url).toBe('https://microbs.io')
  })

  test('package.json has no microbs plugins in "dependencies" or "packages"', () => {
    const json = utils.loadJson(path.join(process.cwd(), 'package.json'))
    for (var key in json.dependencies) {
      expect(key.includes('@microbs.io/plugin-')).toBe(false)
      expect(key.includes('microbs-plugin-')).toBe(false)
    }
    for (var key in json.packages) {
      expect(key.includes('@microbs.io/plugin-')).toBe(false)
      expect(key.includes('microbs-plugin-')).toBe(false)
    }
  })

  test('package-lock.json exists', () => {
    const json = utils.loadJson(path.join(process.cwd(), 'package-lock.json'))
    expect(json).toBeTruthy()
  })

  test('package-lock.json has no microbs plugins in "dependencies" or "packages"', () => {
    const json = utils.loadJson(path.join(process.cwd(), 'package-lock.json'))
    for (var key in json.dependencies) {
      expect(key.includes('@microbs.io/plugin-')).toBe(false)
      expect(key.includes('microbs-plugin-')).toBe(false)
    }
    for (var key in json.packages) {
      expect(key.includes('@microbs.io/plugin-')).toBe(false)
      expect(key.includes('microbs-plugin-')).toBe(false)
    }
  })

  test('package.json and package-lock.json have same version', () => {
    const pkg = utils.loadJson(path.join(process.cwd(), 'package.json'))
    const pkgLock = utils.loadJson(path.join(process.cwd(), 'package-lock.json'))
    expect(pkg.version).toBe(pkgLock.version)
  })
})
