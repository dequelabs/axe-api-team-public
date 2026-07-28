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
  describe('markdown', () => {
    it('accepts a heading with a suffix on the same line', () => {
      assert.ok(isValidFooter('## QA Notes: verify the thing'))
    })

    it('accepts a standalone footer written as a heading', () => {
      assert.ok(isValidFooter('### No QA required'))
    })

    it('accepts an emphasised standalone footer', () => {
      assert.ok(isValidFooter('**No QA needed**'))
    })
  })

  describe('given a section heading', () => {
    it('accepts a bare "QA notes" keyword', () => {
      assert.ok(isValidFooter('## QA Notes', true))
      assert.ok(isValidFooter('## QA notes:', true))
      assert.ok(isValidFooter('QA notes', true))
    })

    it('still rejects issue-linking keywords, which need a reference', () => {
      assert.ok(!isValidFooter('## Closes', true))
      assert.ok(!isValidFooter('## Fixes', true))
      assert.ok(!isValidFooter('## Refs', true))
    })

    it('rejects an unrelated heading', () => {
      assert.ok(!isValidFooter('## Testing', true))
    })
  })

  it('rejects a bare "QA notes" keyword outside a section heading', () => {
    assert.ok(!isValidFooter('QA notes'))
    assert.ok(!isValidFooter('## QA notes'))
  })
})
