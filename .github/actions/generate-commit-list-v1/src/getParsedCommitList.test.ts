import 'mocha'
import { assert } from 'chai'
import getParsedCommitList from './getParsedCommitList'
import {
  expectedParsedCommitList,
  expectedRawCommitList,
  expectedRepositoryURL
} from './test-utils'

describe('getParsedCommitList', () => {
  it('returns the parsed commit list', () => {
    const parsedCommitList = getParsedCommitList({
      rawCommitList: expectedRawCommitList,
      repositoryURL: expectedRepositoryURL
    })

    assert.deepEqual(parsedCommitList, expectedParsedCommitList)
  })
})
