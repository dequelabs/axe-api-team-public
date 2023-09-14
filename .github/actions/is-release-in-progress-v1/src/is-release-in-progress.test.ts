import { assert } from 'chai'
import type { PullRequest } from './types'
import isReleaseInProgress from './is-release-in-progress'

export const BUG_PULL_REQUEST: PullRequest = {
  id: 1,
  state: 'open',
  labels: [{ id: 12345, name: 'bug' }]
}

export const RELEASE_PULL_REQUEST: PullRequest = {
  id: 2,
  state: 'open',
  labels: [{ id: 23456, name: 'release' }]
}

const testCases = [
  {
    input: [],
    inputDescription: 'empty list',
    output: false
  },
  {
    input: [BUG_PULL_REQUEST],
    inputDescription: 'list without release PR',
    output: false
  },
  {
    input: [RELEASE_PULL_REQUEST],
    inputDescription: 'list with release PR',
    output: true
  }
]

describe('isReleaseInProgress()', () => {
  testCases.map(({ input, inputDescription, output }) => {
    it(`returns ${output} for ${inputDescription}`, () => {
      assert.equal(isReleaseInProgress(input), output)
    })
  })
})
