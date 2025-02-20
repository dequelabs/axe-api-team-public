import 'mocha'
import { assert } from 'chai'
import sinon from 'sinon'
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

  afterEach(sinon.restore)

  it('should return the referenced closed issues for a pull request', async () => {
    sinon.stub(octokit, 'graphql').resolves(MOCK_REFERENCED_CLOSED_ISSUES)

    const result = await getReferencedClosedIssues({
      owner: 'owner',
      repo: 'repo',
      pullRequestID: 1,
      octokit
    })

    assert.deepEqual(result, MOCK_REFERENCED_CLOSED_ISSUES)
  })

  describe('when an error occurs', () => {
    it('should throw an error with correct message', async () => {
      const originalError = new Error('boom')

      sinon.stub(octokit, 'graphql').throws(originalError)

      try {
        await getReferencedClosedIssues({
          owner: 'owner',
          repo: 'repo',
          pullRequestID: 1,
          octokit
        })
        assert.fail('Expected error to be thrown')
      } catch (err) {
        const error = err as Error
        assert.include(error.message, 'Failed to get referenced closed issue')
        assert.include(error.message, 'boom')
      }
    })
  })
})
