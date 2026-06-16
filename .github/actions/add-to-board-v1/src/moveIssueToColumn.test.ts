import { describe, it, beforeEach, mock } from 'node:test'
import { strict as assert } from 'node:assert'
import type { MoveIssueToColumnResponse } from './moveIssueToColumn.ts'

type ExecOutput = { stdout: string; stderr: string; exitCode: number }

const getExecOutput = mock.fn<(cmd: string) => Promise<ExecOutput>>(() =>
  Promise.resolve({ stdout: '', stderr: '', exitCode: 0 })
)
mock.module('@actions/exec', { namedExports: { getExecOutput } })

const { default: moveIssueToColumn } = await import('./moveIssueToColumn.ts')

export const MOCK_ISSUE_MOVED: MoveIssueToColumnResponse = {
  id: '123',
  title: 'Issue 1',
  body: 'Issue 1 Body',
  type: 'Issue',
  url: 'https://deque.bizzy.com'
}

describe('moveIssueToColumn', () => {
  beforeEach(() => {
    getExecOutput.mock.resetCalls()
    getExecOutput.mock.mockImplementation(() =>
      Promise.resolve({ stdout: '', stderr: '', exitCode: 0 })
    )
  })

  describe('when given a valid issue card ID, field ID, field column ID, and project ID', () => {
    it('moves the issue to the column', async () => {
      getExecOutput.mock.mockImplementation(() =>
        Promise.resolve({
          stdout: JSON.stringify(MOCK_ISSUE_MOVED),
          stderr: '',
          exitCode: 0
        })
      )

      const issueMoved = await moveIssueToColumn({
        issueCardID: '123',
        fieldID: '456',
        fieldColumnID: '789',
        projectID: '101112'
      })

      assert.deepStrictEqual(issueMoved, MOCK_ISSUE_MOVED)
    })
  })

  describe('when moving the issue to the column fails', () => {
    it('throws an error', async () => {
      getExecOutput.mock.mockImplementation(() =>
        Promise.reject(new Error('Error moving issue to column'))
      )
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

      assert.notStrictEqual(error, null)
      assert.ok(error?.message.includes('Error moving issue to column'))
    })
  })
})
