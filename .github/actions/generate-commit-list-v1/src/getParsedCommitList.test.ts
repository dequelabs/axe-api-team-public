import 'mocha'
import { assert } from 'chai'
import getParsedCommitList from './getParsedCommitList'
import {
  expectedParsedCommitList,
  expectedRawCommitList,
  expectedRepository
} from './test-utils'

describe('getParsedCommitList', () => {
  describe('when all commits values are available', () => {
    it('returns the parsed commit list', () => {
      const parsedCommitList = getParsedCommitList({
        rawCommitList: expectedRawCommitList,
        repository: expectedRepository
      })

      assert.deepEqual(parsedCommitList, expectedParsedCommitList)
    })
  })

  describe('when the PR ID is not available', () => {
    it('returns null for the PR ID', () => {
      const parsedCommitList = getParsedCommitList({
        rawCommitList: ['4d6220e feat: add new feature'],
        repository: expectedRepository
      })

      assert.deepEqual(parsedCommitList, [
        {
          commit: '4d6220e feat: add new feature',
          title: 'feat: add new feature',
          sha: '4d6220e',
          type: 'feat',
          id: null,
          link: null
        }
      ])
    })
  })
})
