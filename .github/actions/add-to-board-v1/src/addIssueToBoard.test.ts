import { describe, it, beforeEach, mock } from 'node:test'
import { strict as assert } from 'node:assert'
import type { AddIssueToBoardResponse } from './addIssueToBoard.ts'

type ExecOutput = { stdout: string; stderr: string; exitCode: number }

const getExecOutput = mock.fn<(cmd: string) => Promise<ExecOutput>>(() =>
  Promise.resolve({ stdout: '', stderr: '', exitCode: 0 })
)
mock.module('@actions/exec', { namedExports: { getExecOutput } })

const { default: addIssueToBoard } = await import('./addIssueToBoard.ts')

export const MOCK_ISSUE_ADDED: AddIssueToBoardResponse = {
  id: '123',
  title: 'Issue 1',
  body: 'Issue 1 Body',
  type: 'Issue',
  url: 'https://deque.bizzy.com'
}

describe('addIssueToBoard', () => {
  beforeEach(() => {
    getExecOutput.mock.resetCalls()
    getExecOutput.mock.mockImplementation(() =>
      Promise.resolve({ stdout: '', stderr: '', exitCode: 0 })
    )
  })

  describe('when given a valid project number, owner, and issue URL', () => {
    it('adds the issue to the board', async () => {
      getExecOutput.mock.mockImplementation(() =>
        Promise.resolve({
          stdout: JSON.stringify(MOCK_ISSUE_ADDED),
          stderr: '',
          exitCode: 0
        })
      )

      const issueAdded = await addIssueToBoard({
        projectNumber: 66,
        owner: 'owner',
        issueUrl: 'https://deque.bizzy.com'
      })

      assert.deepStrictEqual(issueAdded, MOCK_ISSUE_ADDED)
    })
  })

  describe('when adding the issue to the board fails', () => {
    it('throws an error', async () => {
      getExecOutput.mock.mockImplementation(() =>
        Promise.reject(new Error('Error adding issue to board'))
      )
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

      assert.notStrictEqual(error, null)
      assert.ok(error?.message.includes('Error adding issue to board'))
    })
  })
})
