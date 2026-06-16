import { describe, it, mock } from 'node:test'
import { strict as assert } from 'node:assert'

import type { Core, Github } from './types.ts'
import {
  BUG_PULL_REQUEST,
  RELEASE_PULL_REQUEST
} from './isReleaseInProgress.test.ts'
import run from './run.ts'

const testCases = [
  {
    description: 'when there is not a release pull request',
    pullRequests: [BUG_PULL_REQUEST],
    result: false
  },
  {
    description: 'when there is a release pull request',
    pullRequests: [RELEASE_PULL_REQUEST],
    result: true
  }
]

describe('run()', () => {
  it('fails if github-token input is not given', () => {
    const setFailed = mock.fn<(message: string) => void>()
    const core = {
      getInput: mock.fn(() => {
        throw { message: 'github-token input is not given' }
      }),
      setFailed
    }
    const github = {}

    run(core as unknown as Core, github as unknown as Github)

    assert.strictEqual(setFailed.mock.callCount(), 1)
    assert.strictEqual(
      setFailed.mock.calls[0].arguments[0],
      'github-token input is not given'
    )
  })

  testCases.map(({ description, pullRequests, result }) => {
    describe(description, () => {
      it(`sets is-release-in-Progress output to ${result}`, async () => {
        const octokit = {
          rest: {
            pulls: {
              list: mock.fn(async () => ({ data: pullRequests }))
            }
          }
        }
        const setOutput = mock.fn<(name: string, value: boolean) => void>()
        const info = mock.fn<(message: string) => void>()
        const core = {
          getInput: mock.fn(() => 'token'),
          setOutput,
          info
        }
        const github = {
          getOctokit: mock.fn(() => octokit),
          context: {
            repo: {
              owner: 'OWNER',
              repo: 'REPO'
            }
          }
        }

        await run(core as unknown as Core, github as unknown as Github)

        assert.strictEqual(setOutput.mock.callCount(), 1)
        assert.strictEqual(
          setOutput.mock.calls[0].arguments[0],
          'is-release-in-progress'
        )
        assert.strictEqual(setOutput.mock.calls[0].arguments[1], result)

        assert.strictEqual(info.mock.callCount(), 1)
        assert.strictEqual(
          info.mock.calls[0].arguments[0],
          `Set is-release-in-progress output: ${result}`
        )
      })
    })
  })
})
