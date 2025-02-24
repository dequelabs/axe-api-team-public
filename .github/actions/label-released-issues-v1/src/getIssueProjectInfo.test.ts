import 'mocha'
import { assert } from 'chai'
import sinon from 'sinon'
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

  afterEach(sinon.restore)

  it('should return the project info for an issue', async () => {
    sinon.stub(octokit, 'graphql').resolves(MOCK_PROJECT_INFO)

    const result = await getIssueProjectInfo({
      owner: 'owner',
      repo: 'repo',
      issueNumber: 1,
      octokit
    })

    assert.deepEqual(result, MOCK_PROJECT_INFO)
  })

  describe('when an error occurs', () => {
    it('should throw an error with correct message', async () => {
      const originalError = new Error('boom')

      sinon.stub(octokit, 'graphql').throws(originalError)

      try {
        await getIssueProjectInfo({
          owner: 'owner',
          repo: 'repo',
          issueNumber: 1,
          octokit
        })
        assert.fail('Expected error to be thrown')
      } catch (err) {
        const error = err as Error
        assert.include(error.message, 'Failed to get project info for issue 1')
        assert.include(error.message, 'boom')
      }
    })
  })
})
