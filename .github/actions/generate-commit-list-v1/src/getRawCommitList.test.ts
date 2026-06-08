import { describe, it, beforeEach, mock } from 'node:test'
import { strict as assert } from 'node:assert'
import { expectedRawCommitList, rawCommitList } from './testUtils.ts'

type ExecOutput = { stdout: string; stderr: string; exitCode: number }

const getExecOutput = mock.fn<(cmd: string) => Promise<ExecOutput>>(() =>
  Promise.resolve({ stdout: '', stderr: '', exitCode: 0 })
)
mock.module('@actions/exec', { namedExports: { getExecOutput } })

const { default: getRawCommitList } = await import('./getRawCommitList.ts')

describe('getRawCommitList', () => {
  beforeEach(() => {
    getExecOutput.mock.resetCalls()
    getExecOutput.mock.mockImplementation(() =>
      Promise.resolve({ stdout: '', stderr: '', exitCode: 0 })
    )
  })

  describe('when the raw commit list is successfully retrieved', () => {
    it('returns the raw commit list from base and head branches', async () => {
      const base: string = 'base-branch'
      const head: string = 'head-branch'

      getExecOutput.mock.mockImplementation(() =>
        Promise.resolve({ exitCode: 0, stdout: rawCommitList, stderr: '' })
      )

      const rawCommitListParsed = await getRawCommitList({ base, head })

      assert.strictEqual(getExecOutput.mock.callCount(), 1)
      assert.strictEqual(
        getExecOutput.mock.calls[0].arguments[0],
        `git log origin/${base}..origin/${head} --oneline --no-merges --abbrev-commit`
      )
      assert.deepStrictEqual(rawCommitListParsed, expectedRawCommitList)
    })

    it('returns the raw commit list from a tag', async () => {
      const tag: string = 'v1.0.0'

      getExecOutput.mock.mockImplementation(() =>
        Promise.resolve({ exitCode: 0, stdout: rawCommitList, stderr: '' })
      )

      const rawCommitListParsed = await getRawCommitList({ tag })

      assert.strictEqual(getExecOutput.mock.callCount(), 1)
      assert.strictEqual(
        getExecOutput.mock.calls[0].arguments[0],
        `git log ${tag}..HEAD --oneline --no-merges --abbrev-commit`
      )
      assert.deepStrictEqual(rawCommitListParsed, expectedRawCommitList)
    })
  })

  describe('when the raw commit list cannot be retrieved', () => {
    it('throws an error', async () => {
      getExecOutput.mock.mockImplementation(() => {
        throw { stdout: '' }
      })

      let error: Error | null = null
      try {
        await getRawCommitList({
          base: 'base-branch',
          head: 'head-branch'
        })
      } catch (e) {
        error = e as Error
      }

      assert.notStrictEqual(error, null)
      assert.ok(error?.message.includes('Unable to get raw commit list'))
    })
  })
})
