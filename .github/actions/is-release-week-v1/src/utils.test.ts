import { assert } from 'chai'
import { getWeekNumber, isReleaseWeek } from './utils'

describe('is-release-week-v1 utils', () => {
  describe('getWeekNumber()', () => {
    it('returns week number of date correctly', () => {
      assert.isTrue(getWeekNumber(new Date(2023, 0, 1)) === 1)
      assert.isTrue(getWeekNumber(new Date(2023, 0, 7)) === 1)
      assert.isTrue(getWeekNumber(new Date(2023, 0, 8)) === 2)
      assert.isTrue(getWeekNumber(new Date(2023, 8, 6)) === 36)
    })
  })

  describe('isReleaseWeek()', () => {
    describe('when current week is odd week', () => {
      it('returns true if oddWeek is true', () => {
        assert.isTrue(isReleaseWeek(35, true))
      })

      it('returns false if oddWeek is false', () => {
        assert.isFalse(isReleaseWeek(35, false))
      })
    })

    describe('when current week is even week', () => {
      it('returns false if oddWeek is true', () => {
        assert.isFalse(isReleaseWeek(36, true))
      })

      it('returns true if oddWeek is false', () => {
        assert.isTrue(isReleaseWeek(36, false))
      })
    })
  })
})
