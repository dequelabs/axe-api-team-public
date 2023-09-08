import { assert } from 'chai'
import { getWeekNumber, isReleaseWeek } from './utils'

describe('is-release-week-v1 utils', () => {
  describe('getWeekNumber()', () => {
    const testCases = [
      { input: new Date(2023, 0, 1), output: 1 },
      { input: new Date(2023, 0, 7), output: 1 },
      { input: new Date(2023, 0, 8), output: 2 },
      { input: new Date(2023, 8, 6), output: 36 }
    ]

    it('returns week number of date correctly', () => {
      testCases.map(({ input, output }) => {
        assert.equal(getWeekNumber(input), output)
      })
    })
  })

  describe('isReleaseWeek()', () => {
    const testCases = [
      {
        weekType: 'odd',
        weekNumber: 35,
        cases: [
          { input: true, output: true },
          { input: false, output: false }
        ]
      },
      {
        weekType: 'even',
        weekNumber: 36,
        cases: [
          { input: true, output: false },
          { input: false, output: true }
        ]
      }
    ]

    testCases.map(({ weekType, weekNumber, cases }) => {
      describe(`when it is the ${weekType} week`, () => {
        cases.map(({ input, output }) => {
          describe(`when oddWeek is ${input}`, () => {
            it(`returns ${output}`, () => {
              assert.equal(isReleaseWeek(weekNumber, input), output)
            })
          })
        })
      })
    })
  })
})
