import { assert } from 'chai'
import isValidFooter from './isValidFooter'

describe('isValidFooter', () => {
  it('returns true for "Close: "', () => {
    assert.isTrue(isValidFooter('Closes: '))
  })

  it('returns true for "Closes: "', () => {
    assert.isTrue(isValidFooter('Closes: '))
  })

  it('returns true for "Closed: "', () => {
    assert.isTrue(isValidFooter('Closes: '))
  })

  it('returns true for "Fix: "', () => {
    assert.isTrue(isValidFooter('Fix: '))
  })

  it('returns true for "Fixes: "', () => {
    assert.isTrue(isValidFooter('Fixes: '))
  })

  it('returns true for "Fixed: "', () => {
    assert.isTrue(isValidFooter('Fixed: '))
  })

  it('returns true for "resolve: "', () => {
    assert.isTrue(isValidFooter('resolves: '))
  })

  it('returns true for "resolves: "', () => {
    assert.isTrue(isValidFooter('resolves: '))
  })

  it('returns true for "resolved: "', () => {
    assert.isTrue(isValidFooter('resolved: '))
  })

  it('returns true for "Ref: "', () => {
    assert.isTrue(isValidFooter('Ref: '))
  })

  it('returns true for "Refs: "', () => {
    assert.isTrue(isValidFooter('Refs: '))
  })

  it('returns true for "QA Notes: "', () => {
    assert.isTrue(isValidFooter('QA Notes: '))
  })

  it('returns true for "No QA required"', () => {
    assert.isTrue(isValidFooter('No QA required'))
  })

  it('returns true for "No QA needed"', () => {
    assert.isTrue(isValidFooter('No QA needed'))
  })

  it('returns false for empty footer', () => {
    assert.isFalse(isValidFooter(''))
  })

  it('returns false for invalid footer', () => {
    assert.isFalse(isValidFooter('No footer'))
  })

  it('returns false without white space after colon', () => {
    assert.isFalse(isValidFooter('Closes:'))
  })

  it('ignores case', () => {
    assert.isTrue(isValidFooter('closes: '))
  })
})
