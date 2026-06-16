import { describe, it, beforeEach, mock } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  expectedParsedCommitList,
  expectedRawCommitList,
  expectedRepository
} from './testUtils.ts'

type ExecOutput = { stdout: string; stderr: string; exitCode: number }

const getExecOutput = mock.fn<
  (cmd: string, args?: string[]) => Promise<ExecOutput>
>(() => Promise.resolve({ stdout: '', stderr: '', exitCode: 0 }))
mock.module('@actions/exec', { namedExports: { getExecOutput } })

const { default: getParsedCommitList } =
  await import('./getParsedCommitList.ts')

describe('getParsedCommitList', () => {
  beforeEach(() => {
    getExecOutput.mock.resetCalls()
    getExecOutput.mock.mockImplementation(() =>
      Promise.resolve({ stdout: '', stderr: '', exitCode: 0 })
    )
  })

  describe('when all commits values are available', () => {
    it('returns the parsed commit list', async () => {
      const responses: Array<ExecOutput> = [
        { stdout: '', stderr: '', exitCode: 0 },
        { stdout: '456', stderr: '', exitCode: 0 }
      ]
      let callIndex = 0

      getExecOutput.mock.mockImplementation(() => {
        const response = responses[callIndex++]

        // The third fallback lookup has no stubbed response; mirror the
        // original behavior of `getFallbackID` returning null in that case.
        if (!response) {
          throw { stdout: '' }
        }

        return Promise.resolve(response)
      })

      const parsedCommitList = await getParsedCommitList({
        rawCommitList: expectedRawCommitList,
        repository: expectedRepository
      })

      assert.deepStrictEqual(parsedCommitList, expectedParsedCommitList)
    })
  })

  describe('when the PR ID is not available', () => {
    it('returns null for the PR ID', async () => {
      const parsedCommitList = await getParsedCommitList({
        rawCommitList: ['4d6220e feat: add new feature'],
        repository: expectedRepository
      })

      assert.deepStrictEqual(parsedCommitList, [
        {
          commit: '4d6220e feat: add new feature',
          title: 'feat: add new feature',
          sha: '4d6220e',
          type: 'feat',
          id: null,
          link: null
        }
      ])
    })
  })
})
