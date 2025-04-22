import 'mocha'
import sinon from 'sinon'
import { assert } from 'chai'
import { getOctokit } from '@actions/github'
import getIssueLabels, { GetIssueLabelsResult } from './getIssueLabels'

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

describe('getIssueLabels', () => {
  let octokit: ReturnType<typeof getOctokit>

  beforeEach(() => {
    octokit = getOctokit('token')
  })

  afterEach(sinon.restore)

  it('should return issues with their labels', async () => {
    sinon.stub(octokit, 'graphql').resolves(MOCK_ISSUES)

    const result = await getIssueLabels({
      issueOwner: 'owner',
      issueRepo: 'repo',
      issueNumber: 1,
      octokit
    })

    assert.deepEqual(result, MOCK_ISSUES)
  })

  describe('when an error occurs', () => {
    it('should throw an error', async () => {
      const errorMessage = 'some error'

      sinon.stub(octokit, 'graphql').throws(new Error(errorMessage))

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

      assert.isNotNull(error)
      assert.include(error?.message, errorMessage)
    })
  })
})
