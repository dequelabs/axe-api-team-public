import { describe, it, beforeEach, mock } from 'node:test'
import { strict as assert } from 'node:assert'

type ExecOutput = { stdout: string; stderr: string; exitCode: number }

const getExecOutput = mock.fn<
  (cmd: string, args?: string[]) => Promise<ExecOutput>
>(() => Promise.resolve({ stdout: '', stderr: '', exitCode: 0 }))
mock.module('@actions/exec', { namedExports: { getExecOutput } })

const { default: getFallbackID } = await import('./getFallbackID.ts')

describe('getFallbackID', () => {
  beforeEach(() => {
    getExecOutput.mock.resetCalls()
    getExecOutput.mock.mockImplementation(() =>
      Promise.resolve({ stdout: '', stderr: '', exitCode: 0 })
    )
  })

  describe('when the fallback method succeeds to get a PR ID', () => {
    it('returns the ID', async () => {
      getExecOutput.mock.mockImplementation(() =>
        Promise.resolve({ exitCode: 0, stdout: '123', stderr: '' })
      )

      const fallbackID = await getFallbackID('abc')

      assert.strictEqual(fallbackID, '123')
    })
  })

  describe('when the fallback method fails to get a PR ID', () => {
    it('returns null', async () => {
      getExecOutput.mock.mockImplementation(() => {
        throw { stdout: '' }
      })

      const fallbackID = await getFallbackID('abc')

      assert.strictEqual(fallbackID, null)
    })
  })

  describe('when the fallback method throws an error', () => {
    it('returns null', async () => {
      getExecOutput.mock.mockImplementation(() => {
        throw { stdout: '' }
      })

      const fallbackID = await getFallbackID('abc')

      assert.strictEqual(fallbackID, null)
    })
  })
})
