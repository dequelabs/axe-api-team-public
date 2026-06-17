import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import isReleaseInProgress from './isReleaseInProgress.ts'
import {
  BUG_PULL_REQUEST,
  RELEASE_PULL_REQUEST,
  SIMILAR_PULL_REQUEST_1,
  SIMILAR_PULL_REQUEST_2
} from './fixtures.ts'

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
  testCases.forEach(({ input, inputDescription, output }) => {
    it(`returns ${output} for ${inputDescription}`, () => {
      assert.strictEqual(isReleaseInProgress(input), output)
    })
  })
})
