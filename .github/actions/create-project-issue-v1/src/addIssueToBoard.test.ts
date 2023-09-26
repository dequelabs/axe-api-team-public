import 'mocha'
import { assert } from 'chai'
import * as exec from '@actions/exec'
import sinon from 'sinon'
import addIssueToBoard, {
  type AddIssueToBoardResponse
} from './addIssueToBoard'

export const MOCK_ISSUE_ADDED: AddIssueToBoardResponse = {
  id: '123',
  title: 'Issue 1',
  body: 'Issue 1 Body',
  type: 'Issue',
  url: 'https://deque.bizzy.com'
}

describe('addIssueToBoard', () => {
  let getExecOutput: sinon.SinonStub

  beforeEach(() => {
    getExecOutput = sinon.stub(exec, 'getExecOutput')
  })

  afterEach(sinon.restore)

  describe('when given a valid project number, owner, and issue URL', () => {
    it('adds the issue to the board', async () => {
      getExecOutput.resolves({
        stdout: JSON.stringify(MOCK_ISSUE_ADDED),
        stderr: '',
        exitCode: 0
      })

      const issueAdded = await addIssueToBoard({
        projectNumber: 66,
        owner: 'owner',
        issueUrl: 'https://deque.bizzy.com'
      })

      assert.deepEqual(issueAdded, MOCK_ISSUE_ADDED)
    })
  })

  describe('when adding the issue to the board fails', () => {
    it('throws an error', async () => {
      getExecOutput.rejects(new Error('Error adding issue to board'))
      let error: Error | null = null

      try {
        await addIssueToBoard({
          projectNumber: 66,
          owner: 'owner',
          issueUrl: 'https://deque.bizzy.com'
        })
      } catch (err) {
        error = err as Error
      }

      assert.isNotNull(error)
      assert.include(error?.message, 'Error adding issue to board')
    })
  })
})
