import { describe, it, beforeEach, mock } from 'node:test'
import { strict as assert } from 'node:assert'

type ExecOutput = { stdout: string; stderr: string; exitCode: number }

const getExecOutput = mock.fn<(cmd: string) => Promise<ExecOutput>>(() =>
  Promise.resolve({ stdout: '', stderr: '', exitCode: 0 })
)
mock.module('@actions/exec', { namedExports: { getExecOutput } })

const { default: getProjectBoardID } = await import('./getProjectBoardID.ts')

export const MOCK_PROJECT_BOARD_ID = {
  id: '123'
}

describe('getProjectBoardID', () => {
  beforeEach(() => {
    getExecOutput.mock.resetCalls()
    getExecOutput.mock.mockImplementation(() =>
      Promise.resolve({ stdout: '', stderr: '', exitCode: 0 })
    )
  })

  describe('when given a valid project number and owner', () => {
    it('returns the project board ID', async () => {
      getExecOutput.mock.mockImplementation(() =>
        Promise.resolve({
          stdout: JSON.stringify(MOCK_PROJECT_BOARD_ID),
          stderr: '',
          exitCode: 0
        })
      )

      const projectBoardID = await getProjectBoardID({
        projectNumber: 66,
        owner: 'owner'
      })

      assert.deepStrictEqual(projectBoardID, MOCK_PROJECT_BOARD_ID)
    })
  })

  describe('when getting the project board ID fails', () => {
    it('throws an error', async () => {
      getExecOutput.mock.mockImplementation(() =>
        Promise.reject(new Error('Error getting project board ID'))
      )
      let error: Error | null = null

      try {
        await getProjectBoardID({
          projectNumber: 66,
          owner: 'owner'
        })
      } catch (err) {
        error = err as Error
      }

      assert.notStrictEqual(error, null)
      assert.ok(error?.message.includes('Error getting project board ID'))
    })
  })
})
