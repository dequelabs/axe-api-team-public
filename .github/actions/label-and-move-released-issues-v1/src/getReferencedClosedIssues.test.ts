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
            number: 27
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
    it('should throw an error', async () => {
      sinon.stub(octokit, 'graphql').throws(new Error('boom'))

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

      assert.isNotNull(error)
      assert.include(error?.message, 'boom')
    })
  })
})
