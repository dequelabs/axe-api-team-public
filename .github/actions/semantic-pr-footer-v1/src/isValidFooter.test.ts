import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import isValidFooter from './isValidFooter.ts'

describe('isValidFooter', () => {
  const validCases = [
    'Close ',
    'Close: ',
    'Closes ',
    'Closes: ',
    'Closed ',
    'Closed: ',
    'fix ',
    'Fix: ',
    'Fixes ',
    'Fixes: ',
    'Fixed ',
    'Fixed: ',
    'Resolve ',
    'Resolve: ',
    'Resolves ',
    'Resolves: ',
    'Resolved ',
    'Resolved: ',
    'Ref ',
    'Ref: ',
    'Refs ',
    'Refs: ',
    'QA Notes ',
    'QA Notes: ',
    'No QA required',
    'No QA needed',
    'No QA required (test only)',
    'No QA needed: validate as part of separate ticket'
  ]

  for (const validCase of validCases) {
    it(`returns true for "${validCase}"`, () => {
      assert.ok(isValidFooter(validCase))
    })
  }

  it('returns false for empty footer', () => {
    assert.ok(!isValidFooter(''))
  })

  it('returns false for invalid footer', () => {
    assert.ok(!isValidFooter('No footer'))
  })

  it('returns false without white space after colon', () => {
    assert.ok(!isValidFooter('Closes:'))
  })

  it('ignores case', () => {
    assert.ok(isValidFooter('closes: '))
  })
})
