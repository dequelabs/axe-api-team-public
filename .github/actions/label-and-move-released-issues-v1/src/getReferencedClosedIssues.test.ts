import { describe, it, beforeEach, mock } from 'node:test'
import { strict as assert } from 'node:assert'
import { getOctokit } from '@actions/github'
import getReferencedClosedIssues, {
  GetReferencedClosedIssuesResult
} from './getReferencedClosedIssues'

const MOCK_REFERENCED_CLOSED_ISSUES: GetReferencedClosedIssuesResult = {
  repository: {
    pullRequest: {
      closingIssuesReferences: {
        nodes: [
          {
            number: 27,
            repository: {
              owner: { login: 'issue-owner' },
              name: 'issue-repo-name'
            }
          }
        ]
      }
    }
  }
}

describe('getReferencedClosedIssues', () => {
  let octokit: ReturnType<typeof getOctokit>

  beforeEach(() => {
    octokit = getOctokit('token')
  })

  it('should return the referenced closed issues for a pull request', async () => {
    octokit.graphql = mock.fn(() =>
      Promise.resolve(MOCK_REFERENCED_CLOSED_ISSUES)
    ) as unknown as typeof octokit.graphql

    const result = await getReferencedClosedIssues({
      owner: 'owner',
      repo: 'repo',
      pullRequestID: 1,
      octokit
    })

    assert.deepStrictEqual(result, MOCK_REFERENCED_CLOSED_ISSUES)
  })

  describe('when an error occurs', () => {
    it('should throw an error', async () => {
      octokit.graphql = mock.fn(() => {
        throw new Error('boom')
      }) as unknown as typeof octokit.graphql

      let error: Error | null = null

      try {
        await getReferencedClosedIssues({
          owner: 'owner',
          repo: 'repo',
          pullRequestID: 1,
          octokit
        })
      } catch (err) {
        error = err as Error
      }

      assert.strictEqual(error !== null, true)
      assert.ok(error?.message.includes('boom'))
    })
  })
})
