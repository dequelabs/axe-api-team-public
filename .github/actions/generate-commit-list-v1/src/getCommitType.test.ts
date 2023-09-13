import 'mocha'
import { assert } from 'chai'
import getCommitType, { validCommitTypes } from './getCommitType'

describe('getCommitType', () => {
  describe('when the commit title is invalid', () => {
    it('throws an error', () => {
      assert.throws(() =>
        getCommitType('invalid commit type: this is not a valid commit type')
      )
    })
  })

  describe('when the commit title is not scoped', () => {
    validCommitTypes.forEach(commitType => {
      it(`returns ${commitType}`, () => {
        const result = getCommitType(
          `${commitType}: this is not a scoped commit title`
        )

        assert.equal(result, commitType)
      })
    })
  })

  describe('when the commit title is scoped', () => {
    validCommitTypes.forEach(commitType => {
      it(`returns ${commitType}`, () => {
        const result = getCommitType(
          `${commitType}(scope): this is a scoped commit title`
        )

        assert.equal(result, commitType)
      })
    })
  })

  describe('when the commit title is a breaking change', () => {
    describe('when the commit title is not scoped', () => {
      it('returns feat!', () => {
        const result = getCommitType('feat!: this is a breaking change')

        assert.equal(result, 'feat!')
      })
    })

    describe('when the commit title is scoped', () => {
      it('returns feat!', () => {
        const result = getCommitType('feat(scope)!: this is a breaking change')

        assert.equal(result, 'feat!')
      })
    })
  })
})
