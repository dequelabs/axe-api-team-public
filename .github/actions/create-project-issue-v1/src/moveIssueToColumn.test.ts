import 'mocha'
import { assert } from 'chai'
import * as exec from '@actions/exec'
import sinon from 'sinon'
import moveIssueToColumn, {
  type MoveIssueToColumnResponse
} from './moveIssueToColumn'

export const MOCK_ISSUE_MOVED: MoveIssueToColumnResponse = {
  id: '123',
  title: 'Issue 1',
  body: 'Issue 1 Body',
  type: 'Issue',
  url: 'https://deque.bizzy.com'
}

describe('moveIssueToColumn', () => {
  let getExecOutput: sinon.SinonStub

  beforeEach(() => {
    getExecOutput = sinon.stub(exec, 'getExecOutput')
  })

  afterEach(sinon.restore)

  describe('when given a valid issue card ID, field ID, field column ID, and project ID', () => {
    it('moves the issue to the column', async () => {
      getExecOutput.resolves({
        stdout: JSON.stringify(MOCK_ISSUE_MOVED),
        stderr: '',
        exitCode: 0
      })

      const issueMoved = await moveIssueToColumn({
        issueCardID: '123',
        fieldID: '456',
        fieldColumnID: '789',
        projectID: '101112'
      })

      assert.deepEqual(issueMoved, MOCK_ISSUE_MOVED)
    })
  })

  describe('when moving the issue to the column fails', () => {
    it('throws an error', async () => {
      getExecOutput.rejects(new Error('Error moving issue to column'))
      let error: Error | null = null

      try {
        await moveIssueToColumn({
          issueCardID: '123',
          fieldID: '456',
          fieldColumnID: '789',
          projectID: '101112'
        })
      } catch (err) {
        error = err as Error
      }

      assert.isNotNull(error)
      assert.include(error?.message, 'Error moving issue to column')
    })
  })
})
