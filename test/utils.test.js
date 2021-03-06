/*
 * utils.test.js
 *
 * Unit tests for ./src/utils.js
 */

describe('utils', () => {

  test('utils.exec()', () => {
    const utils = require('../src/utils')
    const s = utils.exec('echo "hello"', true)
    expect(s.stdout.trim()).toBe('hello')
  })
  
  test('utils.sanitize()', () => {
    const utils = require('../src/utils')
    const str1 = utils.sanitize('./directory/@microbs.io/file.json')
    const expected1 = './directory/@microbs.io/file.json'
    expect(str1).toBe(expected1)
    const str2 = utils.sanitize('foo bar')
    const expected2 = "'foo bar'"
    expect(str2).toBe(expected2)
    const str3 = utils.sanitize('foo;bar')
    const expected3 = 'foo\\;bar'
    expect(str3).toBe(expected3)
  })

  test('utils.expandvars()', () => {
    const utils = require('../src/utils')
    const vars = { A: "foo", B: 123, C: '', D: null }
    const str = [ 'A=${A}', 'B=${B}', 'C=${C}', 'D=${D}', 'E=${E}' ].join('\n')
    const expected = [ 'A=foo', 'B=123', 'C=', 'D=null', 'E=undefined' ].join('\n')
    const actual = utils.expandvars(str, vars)
    expect(actual).toBe(expected)
  })

  test('utils.objToEnv()', () => {
    const utils = require('../src/utils')
    const obj = {
      'A': {
        'B.C': '1.2.3'
      },
      'D.E': '4',
      'F': 3.14,
      'G': 1,
      'H': -1,
      'I': 0,
      'J': true,
      'K': false,
      'L': '',
      'M': null,
      'N': undefined
    }
    const expected = `
A_B_C=1.2.3
D_E=4
F=3.14
G=1
H=-1
I=0
J=true
K=false
L=
N=undefined`.trim()
    const actual = utils.objToEnv(obj)
    expect(actual).toBe(expected)
  })
})
