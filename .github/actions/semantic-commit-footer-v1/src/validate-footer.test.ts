import { assert } from 'chai'
import isValidFooter from './validate-title'

describe('is-valid-footer', () => {
  it('returns true for "Closes: "', () => {
    assert.isTrue(isValidFooter('Closes: '))
  })

  it('returns true for "Closes: "', () => {
    assert.isTrue(isValidFooter('Closes: '))
  })
})
