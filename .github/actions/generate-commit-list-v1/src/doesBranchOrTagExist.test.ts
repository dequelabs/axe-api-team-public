import { describe, it, beforeEach, mock } from 'node:test'
import { strict as assert } from 'node:assert'

type ExecOutput = { stdout: string; stderr: string; exitCode: number }

const getExecOutput = mock.fn<(cmd: string) => Promise<ExecOutput>>(() =>
  Promise.resolve({ stdout: '', stderr: '', exitCode: 0 })
)
mock.module('@actions/exec', { namedExports: { getExecOutput } })

const { default: doesBranchOrTagExist } =
  await import('./doesBranchOrTagExist.ts')

describe('doesBranchOrTagExist', () => {
  beforeEach(() => {
    getExecOutput.mock.resetCalls()
    getExecOutput.mock.mockImplementation(() =>
      Promise.resolve({ stdout: '', stderr: '', exitCode: 0 })
    )
  })

  describe('when the branch exists', () => {
    it('returns true', async () => {
      const branchName: string = 'my-branch-name'

      getExecOutput.mock.mockImplementation(() =>
        Promise.resolve({
          exitCode: 0,
          stdout: 'refs/heads/my-branch-name',
          stderr: ''
        })
      )

      const branchExists = await doesBranchOrTagExist({ branchName })

      assert.strictEqual(getExecOutput.mock.callCount(), 1)
      assert.strictEqual(
        getExecOutput.mock.calls[0].arguments[0],
        `git rev-parse --verify origin/${branchName}`
      )
      assert.ok(branchExists)
    })
  })

  describe('when the tag exists', () => {
    it('returns true', async () => {
      const tag: string = 'my-tag-name'

      getExecOutput.mock.mockImplementation(() =>
        Promise.resolve({
          exitCode: 0,
          stdout: 'refs/tags/my-tag-name',
          stderr: ''
        })
      )

      const tagExists = await doesBranchOrTagExist({ tag })

      assert.strictEqual(getExecOutput.mock.callCount(), 1)
      assert.strictEqual(
        getExecOutput.mock.calls[0].arguments[0],
        `git rev-parse --verify ${tag}`
      )
      assert.ok(tagExists)
    })
  })

  describe('when the branch does not exist', () => {
    it('returns false', async () => {
      getExecOutput.mock.mockImplementation(() => {
        throw { stdout: '' }
      })

      const branchExists = await doesBranchOrTagExist({
        branchName: 'my-branch-name'
      })

      assert.ok(!branchExists)
    })
  })

  describe('when the tag does not exist', () => {
    it('returns false', async () => {
      getExecOutput.mock.mockImplementation(() => {
        throw { stdout: '' }
      })

      const tagExists = await doesBranchOrTagExist({ tag: 'my-tag-name' })

      assert.ok(!tagExists)
    })
  })
})
