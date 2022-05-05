/*
 * context.test.js
 *
 * Unit tests for ./src/context.js
 */

// Third-party packages
const resolve = require('resolve')

describe('context', () => {

  test('context.get() [default]', () => {
    jest.isolateModules(() => {
      const context = require('../src/context')
      expect(JSON.stringify(context.get())).toBe('{}')
    })
  })

  test('context.set() [basic]', () => {
    jest.isolateModules(() => {
      const context = require('../src/context')
      context.set('foo', 'bar')
      expect(JSON.stringify(context.get())).toBe('{"foo":"bar"}')
    })
  })

  test('context.set() [null]', () => {
    jest.isolateModules(() => {
      const context = require('../src/context')
      context.set('foo', null)
      expect(JSON.stringify(context.get())).toBe('{"foo":null}')
    })
  })

  test('context.set() [undefined]', () => {
    jest.isolateModules(() => {
      const context = require('../src/context')
      expect(() => context.set('foo', undefined)).toThrow()
    })
  })

  test('context.set() [immutable]', () => {
    jest.isolateModules(() => {
      const context = require('../src/context')
      context.set('foo', 'bar')
      context.set('foo', 'baz')
      expect(JSON.stringify(context.get())).toBe('{"foo":"bar"}')
    })
  })

  test('context.set() [nested]', () => {
    jest.isolateModules(() => {
      const context = require('../src/context')
      context.set('a.b.c', 123)
      expect(JSON.stringify(context.get())).toBe('{"a":{"b":{"c":123}}}')
    })
  })

  test('context.get() [nested]', () => {
    jest.isolateModules(() => {
      const context = require('../src/context')
      context.set('a.b.c', 123)
      expect(JSON.stringify(context.get('a.b'))).toBe('{"c":123}')
    })
  })
})
