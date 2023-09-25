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

export const SIMILAR_PULL_REQUEST_1: PullRequest = {
  id: 2,
  state: 'open',
  labels: [{ id: 34567, name: 'release-2023' }]
}

export const SIMILAR_PULL_REQUEST_2: PullRequest = {
  id: 2,
  state: 'open',
  labels: [{ id: 45678, name: 'prerelease' }]
}

const testCases = [
  {
    input: [],
    inputDescription: 'empty list',
    output: false
  },
  {
    input: [BUG_PULL_REQUEST],
    inputDescription: 'list without a release PR',
    output: false
  },
  {
    input: [BUG_PULL_REQUEST, SIMILAR_PULL_REQUEST_1],
    inputDescription: 'list with a PR with a similar label',
    output: false
  },
  {
    input: [BUG_PULL_REQUEST, SIMILAR_PULL_REQUEST_2],
    inputDescription: 'list with a PR with a similar label',
    output: false
  },
  {
    input: [BUG_PULL_REQUEST, RELEASE_PULL_REQUEST],
    inputDescription: 'list with a release PR',
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
