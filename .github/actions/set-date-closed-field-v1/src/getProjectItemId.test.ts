import 'mocha'
import sinon from 'sinon'
import { assert } from 'chai'
import { getOctokit } from '@actions/github'
import getProjectItemId from './getProjectItemId'

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
  let octokit: ReturnType<typeof getOctokit>
  let graphql: sinon.SinonStub

  beforeEach(() => {
    octokit = getOctokit('token')
    graphql = sinon.stub(octokit, 'graphql')
  })

  afterEach(sinon.restore)

  it('should return itemId and projectId for matching project number', async () => {
    graphql.resolves(GRAPHQL_RESPONSE)

    const result = await getProjectItemId({
      octokit,
      owner,
      repo,
      issueNumber,
      projectNumber
    })

    assert.deepEqual(result, {
      itemId: MOCK_PROJECT_ITEM_ID,
      projectId: MOCK_PROJECT_ID
    })
  })

  it('should return null when issue is not in the specified project', async () => {
    graphql.resolves({
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
    })

    const result = await getProjectItemId({
      octokit,
      owner,
      repo,
      issueNumber,
      projectNumber
    })

    assert.isNull(result)
  })

  it('should return null when issue has no project items', async () => {
    graphql.resolves({
      repository: {
        issue: {
          projectItems: {
            nodes: []
          }
        }
      }
    })

    const result = await getProjectItemId({
      octokit,
      owner,
      repo,
      issueNumber,
      projectNumber
    })

    assert.isNull(result)
  })

  it('should throw an error with correct message when graphql fails', async () => {
    const errorMessage = 'GraphQL error'
    graphql.rejects(new Error(errorMessage))

    try {
      await getProjectItemId({
        octokit,
        owner,
        repo,
        issueNumber,
        projectNumber
      })
      assert.fail('Expected error to be thrown')
    } catch (err) {
      const error = err as Error
      assert.include(error.message, 'Failed to get project item ID:')
      assert.include(error.message, errorMessage)
    }
  })
})
