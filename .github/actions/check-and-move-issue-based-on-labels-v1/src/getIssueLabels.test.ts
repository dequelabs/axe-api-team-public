import { describe, it, beforeEach, mock } from 'node:test'
import { strict as assert } from 'node:assert'
import type { getOctokit } from '@actions/github'
import type { GetIssueLabelsResult } from './getIssueLabels.ts'

const MOCK_ISSUES: GetIssueLabelsResult = {
  repository: {
    issue: {
      id: 'I_kwDOLYvJE86pLaA1',
      number: 1,
      url: 'https://github.com/dequelabs/repo/issues/1',
      labels: {
        nodes: [
          {
            name: 'some-label'
          }
        ]
      },
      projectItems: {
        nodes: [
          {
            id: 'PVTI_lADOAD55W84AjfJEzgYzmqU4',
            project: {
              number: 123
            }
          },
          {
            id: 'PVTI_lADOAD55W84Aj5R-zgYzmqZ1',
            project: {
              number: 456
            }
          }
        ]
      }
    }
  }
}

const graphql = mock.fn<() => Promise<GetIssueLabelsResult>>(() =>
  Promise.resolve(MOCK_ISSUES)
)
const octokit = { graphql } as unknown as ReturnType<typeof getOctokit>

const { default: getIssueLabels } = await import('./getIssueLabels.ts')

describe('getIssueLabels', () => {
  beforeEach(() => {
    graphql.mock.resetCalls()
    graphql.mock.mockImplementation(() => Promise.resolve(MOCK_ISSUES))
  })

  it('should return issues with their labels', async () => {
    const result = await getIssueLabels({
      issueOwner: 'owner',
      issueRepo: 'repo',
      issueNumber: 1,
      octokit
    })

    assert.deepStrictEqual(result, MOCK_ISSUES)
  })

  describe('when an error occurs', () => {
    it('should throw an error', async () => {
      const errorMessage = 'some error'

      graphql.mock.mockImplementation(() => {
        throw new Error(errorMessage)
      })

      let error: Error | null = null

      try {
        await getIssueLabels({
          issueOwner: 'owner',
          issueRepo: 'repo',
          issueNumber: 1,
          octokit
        })
      } catch (err) {
        error = err as Error
      }

      assert.strictEqual(error !== null, true)
      assert.ok(error?.message.includes(errorMessage))
    })
  })
})
