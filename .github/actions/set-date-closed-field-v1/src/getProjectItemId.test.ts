import { describe, it, beforeEach, mock } from 'node:test'
import { strict as assert } from 'node:assert'
import type { getOctokit } from '@actions/github'
import getProjectItemId from './getProjectItemId'

type Graphql = ReturnType<typeof getOctokit>['graphql']

const owner = 'test-org'
const repo = 'test-repo'
const issueNumber = 123
const projectNumber = 456

const MOCK_PROJECT_ITEM_ID = 'PVTI_lADOAD55W84Aj5R-zgYzmqZ1'
const MOCK_PROJECT_ID = 'PVT_kwDOAD55W84Aj5R-'

const GRAPHQL_RESPONSE = {
  repository: {
    issue: {
      projectItems: {
        nodes: [
          {
            id: MOCK_PROJECT_ITEM_ID,
            project: {
              number: projectNumber,
              id: MOCK_PROJECT_ID
            }
          },
          {
            id: 'PVTI_other',
            project: {
              number: 789,
              id: 'PVT_other'
            }
          }
        ]
      }
    }
  }
}

describe('getProjectItemId', () => {
  const graphql = mock.fn<Graphql>()
  const octokit = { graphql } as unknown as ReturnType<typeof getOctokit>

  beforeEach(() => {
    graphql.mock.resetCalls()
  })

  it('should return itemId and projectId for matching project number', async () => {
    graphql.mock.mockImplementation((() =>
      Promise.resolve(GRAPHQL_RESPONSE)) as unknown as Graphql)

    const result = await getProjectItemId({
      octokit,
      owner,
      repo,
      issueNumber,
      projectNumber
    })

    assert.deepStrictEqual(result, {
      itemId: MOCK_PROJECT_ITEM_ID,
      projectId: MOCK_PROJECT_ID
    })
  })

  it('should return null when issue is not in the specified project', async () => {
    graphql.mock.mockImplementation((() =>
      Promise.resolve({
        repository: {
          issue: {
            projectItems: {
              nodes: [
                {
                  id: 'PVTI_other',
                  project: {
                    number: 999,
                    id: 'PVT_other'
                  }
                }
              ]
            }
          }
        }
      })) as unknown as Graphql)

    const result = await getProjectItemId({
      octokit,
      owner,
      repo,
      issueNumber,
      projectNumber
    })

    assert.strictEqual(result, null)
  })

  it('should return null when issue has no project items', async () => {
    graphql.mock.mockImplementation((() =>
      Promise.resolve({
        repository: {
          issue: {
            projectItems: {
              nodes: []
            }
          }
        }
      })) as unknown as Graphql)

    const result = await getProjectItemId({
      octokit,
      owner,
      repo,
      issueNumber,
      projectNumber
    })

    assert.strictEqual(result, null)
  })

  it('should throw an error with correct message when graphql fails', async () => {
    const errorMessage = 'GraphQL error'
    graphql.mock.mockImplementation((() =>
      Promise.reject(new Error(errorMessage))) as unknown as Graphql)

    await assert.rejects(
      getProjectItemId({
        octokit,
        owner,
        repo,
        issueNumber,
        projectNumber
      }),
      (err: Error) => {
        assert.ok(err.message.includes('Failed to get project item ID:'))
        assert.ok(err.message.includes(errorMessage))
        return true
      }
    )
  })
})
