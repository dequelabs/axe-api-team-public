import { describe, it, beforeEach, mock } from 'node:test'
import { strict as assert } from 'node:assert'
import { getOctokit } from '@actions/github'
import getIssueProjectInfo, {
  GetIssueProjectInfoResult
} from './getIssueProjectInfo'

const MOCK_PROJECT_INFO: GetIssueProjectInfoResult = {
  repository: {
    issue: {
      projectItems: {
        nodes: [
          {
            id: 'PVTI_lADOAD55W84AVmLazgJbJGI',
            type: 'ISSUE',
            project: {
              number: 104
            },
            fieldValueByName: {
              name: 'Done'
            }
          }
        ]
      }
    }
  }
}

describe('getIssueProjectInfo', () => {
  let octokit: ReturnType<typeof getOctokit>

  beforeEach(() => {
    octokit = getOctokit('token')
  })

  it('should return the project info for an issue', async () => {
    octokit.graphql = mock.fn(() =>
      Promise.resolve(MOCK_PROJECT_INFO)
    ) as unknown as typeof octokit.graphql

    const result = await getIssueProjectInfo({
      owner: 'owner',
      repo: 'repo',
      issueNumber: 1,
      octokit
    })

    assert.deepStrictEqual(result, MOCK_PROJECT_INFO)
  })

  describe('when an error occurs', () => {
    it('should throw an error', async () => {
      octokit.graphql = mock.fn(() => {
        throw new Error('boom')
      }) as unknown as typeof octokit.graphql

      let error: Error | null = null

      try {
        await getIssueProjectInfo({
          owner: 'owner',
          repo: 'repo',
          issueNumber: 1,
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
