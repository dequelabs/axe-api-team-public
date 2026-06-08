import { describe, it, beforeEach, mock } from 'node:test'
import { strict as assert } from 'node:assert'
import type { ProjectBoardFieldListResponse } from './getProjectBoardFieldList.ts'

type ExecOutput = { stdout: string; stderr: string; exitCode: number }

const getExecOutput = mock.fn<(cmd: string) => Promise<ExecOutput>>(() =>
  Promise.resolve({ stdout: '', stderr: '', exitCode: 0 })
)
mock.module('@actions/exec', { namedExports: { getExecOutput } })

const { default: getProjectBoardFieldList } =
  await import('./getProjectBoardFieldList.ts')

export const MOCK_FIELD_LIST: ProjectBoardFieldListResponse = {
  fields: [
    {
      id: '123',
      name: 'Status',
      type: 'ProjectV2',
      options: [
        {
          id: '456',
          name: 'Backlog'
        }
      ]
    }
  ],
  totalCount: 1
}

describe('getProjectBoardFieldList', () => {
  beforeEach(() => {
    getExecOutput.mock.resetCalls()
    getExecOutput.mock.mockImplementation(() =>
      Promise.resolve({ stdout: '', stderr: '', exitCode: 0 })
    )
  })

  describe('when given a valid project number and owner', () => {
    it('returns the project field list', async () => {
      getExecOutput.mock.mockImplementation(() =>
        Promise.resolve({
          stdout: JSON.stringify(MOCK_FIELD_LIST),
          stderr: '',
          exitCode: 0
        })
      )

      const projectFieldList = await getProjectBoardFieldList({
        projectNumber: 66,
        owner: 'owner'
      })

      assert.deepStrictEqual(projectFieldList, MOCK_FIELD_LIST)
    })
  })

  describe('when getting the project field list fails', () => {
    it('throws an error', async () => {
      getExecOutput.mock.mockImplementation(() =>
        Promise.reject(new Error('Error getting project field list'))
      )
      let error: Error | null = null

      try {
        await getProjectBoardFieldList({
          projectNumber: 66,
          owner: 'owner'
        })
      } catch (err) {
        error = err as Error
      }

      assert.notStrictEqual(error, null)
      assert.ok(error?.message.includes('Error getting project field list'))
    })
  })
})
