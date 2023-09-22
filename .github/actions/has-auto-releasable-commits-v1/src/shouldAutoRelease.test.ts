import 'mocha'
import { assert } from 'chai'
import shouldAutoRelease from './shouldAutoRelease'

const createCommit = (type: string | null) => ({
  commit: 'PLACEHOLDER',
  title: `PLACEHOLDER ${type}: abcd`,
  sha: 'PLACEHOLDER',
  type,
  id: 'PLACEHOLDER',
  link: 'PLACEHOLDER'
})

const createAxecoreCommit = (type: string | null) => ({
  commit: 'update axe-core to',
  title: `PLACEHOLDER ${type}: update axe-core to`,
  sha: 'PLACEHOLDER',
  type,
  id: 'PLACEHOLDER',
  link: 'PLACEHOLDER'
})

const TEST_CASES_WITHOUT_AXE_NOT_LOCKED = [
  {
    type: 'fix',
    commitList: [createCommit('fix')],
    isVersionLocked: false,
    expected: true
  },
  {
    type: 'feat',
    commitList: [createCommit('feat')],
    isVersionLocked: false,
    expected: true
  },
  {
    type: 'fix!',
    commitList: [createCommit('fix!')],
    isVersionLocked: false,
    expected: true
  },
  {
    type: 'feat!',
    commitList: [createCommit('feat!')],
    isVersionLocked: false,
    expected: true
  }
]

// version locked
const TEST_CASES_WITHOUT_AXE = [
  {
    type: 'fix',
    commitList: [createCommit('fix')],
    isVersionLocked: true,
    expected: true
  },
  {
    type: 'feat',
    commitList: [createCommit('feat')],
    isVersionLocked: true,
    expected: true
  },
  {
    type: 'fix!',
    commitList: [createCommit('fix!')],
    isVersionLocked: true,
    expected: false
  },
  {
    type: 'feat!',
    commitList: [createCommit('feat!')],
    isVersionLocked: true,
    expected: false
  }
]

const TEST_CASES_WITH_AXE = [
  {
    type: 'fix',
    commitList: [createCommit('fix'), createAxecoreCommit('fix')],
    isVersionLocked: true,
    expected: true
  },
  {
    type: 'feat',
    commitList: [createCommit('feat'), createAxecoreCommit('feat')],
    isVersionLocked: true,
    expected: false
  },
  {
    type: 'fix!',
    commitList: [createCommit('fix'), createAxecoreCommit('fix!')],
    isVersionLocked: true,
    expected: false
  },
  {
    type: 'feat!',
    commitList: [createCommit('feat'), createAxecoreCommit('feat!')],
    isVersionLocked: true,
    expected: false
  }
]

describe('shouldAutoRelease', () => {
  describe('when there are no commits', () => {
    describe('and version is not locked', () => {
      it('returns false', () => {
        const result = shouldAutoRelease({
          commitList: [],
          isVersionLocked: false
        })
        assert.isFalse(result)
      })
    })

    describe('and version is locked', () => {
      it('returns false', () => {
        const result = shouldAutoRelease({
          commitList: [],
          isVersionLocked: true
        })
        assert.isFalse(result)
      })
    })
  })

  describe('when there are commits', () => {
    describe('and version is not locked', () => {
      TEST_CASES_WITHOUT_AXE_NOT_LOCKED.forEach(
        ({ type, commitList, expected, isVersionLocked }) => {
          it(`should return ${expected} for ${type}`, () => {
            const result = shouldAutoRelease({
              commitList,
              isVersionLocked
            })

            assert.equal(result, expected)
          })
        }
      )

      describe('and there is no commit type', () => {
        it('returns false', () => {
          const result = shouldAutoRelease({
            commitList: [createCommit(null)],
            isVersionLocked: false
          })

          assert.isFalse(result)
        })
      })
    })

    describe('and version is locked', () => {
      describe('and there are no changes for axe-core', () => {
        TEST_CASES_WITHOUT_AXE.forEach(
          ({ type, commitList, expected, isVersionLocked }) => {
            it(`should return ${expected} for ${type}`, () => {
              const result = shouldAutoRelease({
                commitList,
                isVersionLocked
              })

              assert.equal(result, expected)
            })
          }
        )
      })

      describe('and there are changes for axe-core', () => {
        TEST_CASES_WITH_AXE.forEach(
          ({ type, commitList, expected, isVersionLocked }) => {
            it(`should return ${expected} for ${type}`, () => {
              const result = shouldAutoRelease({
                commitList,
                isVersionLocked
              })

              assert.equal(result, expected)
            })
          }
        )
      })

      describe('and there is no commit type', () => {
        it('returns false', () => {
          const result = shouldAutoRelease({
            commitList: [createCommit(null)],
            isVersionLocked: true
          })

          assert.isFalse(result)
        })
      })
    })
  })
})
