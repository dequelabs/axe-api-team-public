import 'mocha'
import { assert } from 'chai'
import getCommitType, { validCommitTypes } from './getCommitType'

describe('getCommitType', () => {
  describe('when the commit type is invalid', () => {
    it('throws an error', () => {
      assert.throws(() =>
        getCommitType('invalid commit type: this is not a valid commit type')
      )
    })
  })

  describe('when the commit type is not scoped', () => {
    validCommitTypes.forEach(commitType => {
      it(`returns ${commitType}`, () => {
        const result = getCommitType(
          `${commitType}: this is not a scoped commit title`
        )

        assert.equal(result, commitType)
      })
    })
  })

  describe('when the commit type is scoped', () => {
    validCommitTypes.forEach(commitType => {
      it(`returns ${commitType}`, () => {
        const result = getCommitType(
          `${commitType}(scope): this is a scoped commit title`
        )

        assert.equal(result, commitType)
      })
    })
  })
})
