import { describe, it, beforeEach, mock } from 'node:test'
import { strict as assert } from 'node:assert'
import type { Core, Github } from './types.ts'
import {
  expectedParsedCommitList,
  rawCommitList,
  expectedRepository
} from './testUtils.ts'

type ExecOutput = { stdout: string; stderr: string; exitCode: number }

const getExecOutput = mock.fn<
  (cmd: string, args?: string[]) => Promise<ExecOutput>
>(() => Promise.resolve({ stdout: '', stderr: '', exitCode: 0 }))
mock.module('@actions/exec', { namedExports: { getExecOutput } })

const { default: run } = await import('./run.ts')

const [owner, repo] = expectedRepository.split('/')
const github = {
  context: {
    repo: { owner, repo }
  }
}

function makeGetInput(inputs: Record<string, string>) {
  return mock.fn((name: string) => inputs[name] ?? '')
}

describe('run', () => {
  beforeEach(() => {
    getExecOutput.mock.resetCalls()
    getExecOutput.mock.mockImplementation(() =>
      Promise.resolve({ stdout: '', stderr: '', exitCode: 0 })
    )
  })

  describe('when nothing in input is provided', () => {
    it('should throw an error', async () => {
      const getInput = makeGetInput({ base: '', head: '', tag: '' })
      const setFailed = mock.fn()

      const core = { getInput, setFailed }

      await run(core as unknown as Core, github as unknown as Github)

      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(
        setFailed.mock.calls[0].arguments[0],
        'You must provide either a tag or both a base and head branch.'
      )
    })
  })

  describe('when only base input is provided', () => {
    it('should throw an error', async () => {
      const getInput = makeGetInput({ base: 'main', head: '', tag: '' })
      const setFailed = mock.fn()

      const core = { getInput, setFailed }

      await run(core as unknown as Core, github as unknown as Github)

      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(
        setFailed.mock.calls[0].arguments[0],
        'You must provide either a tag or both a base and head branch.'
      )
    })
  })

  describe('when only head input is provided', () => {
    it('should throw an error', async () => {
      const getInput = makeGetInput({ base: '', head: 'main', tag: '' })
      const setFailed = mock.fn()

      const core = { getInput, setFailed }

      await run(core as unknown as Core, github as unknown as Github)

      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(
        setFailed.mock.calls[0].arguments[0],
        'You must provide either a tag or both a base and head branch.'
      )
    })
  })

  describe('when tag and base inputs are provided', () => {
    it('should throw an error', async () => {
      const getInput = makeGetInput({ base: 'main', head: '', tag: 'v1.0.0' })
      const setFailed = mock.fn()

      const core = { getInput, setFailed }

      await run(core as unknown as Core, github as unknown as Github)

      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(
        setFailed.mock.calls[0].arguments[0],
        'You cannot provide both a tag and both a base and head branch.'
      )
    })
  })

  describe('when tag and head inputs are provided', () => {
    it('should throw an error', async () => {
      const getInput = makeGetInput({ base: '', head: 'main', tag: 'v1.0.0' })
      const setFailed = mock.fn()

      const core = { getInput, setFailed }

      await run(core as unknown as Core, github as unknown as Github)

      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(
        setFailed.mock.calls[0].arguments[0],
        'You cannot provide both a tag and both a base and head branch.'
      )
    })
  })

  describe('when tag, base, and head inputs are provided', () => {
    it('should throw an error', async () => {
      const getInput = makeGetInput({
        base: 'release',
        head: 'main',
        tag: 'v1.0.0'
      })
      const setFailed = mock.fn()

      const core = { getInput, setFailed }

      await run(core as unknown as Core, github as unknown as Github)

      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(
        setFailed.mock.calls[0].arguments[0],
        'You cannot provide both a tag and both a base and head branch.'
      )
    })
  })

  describe('when a base branch does not exist', () => {
    it('should throw an error', async () => {
      const getInput = makeGetInput({ base: 'main', head: 'release', tag: '' })
      const setFailed = mock.fn()
      const info = mock.fn()

      getExecOutput.mock.mockImplementation(() => {
        throw { stdout: '' }
      })

      const core = { getInput, setFailed, info }

      await run(core as unknown as Core, github as unknown as Github)

      assert.strictEqual(info.mock.callCount(), 1)
      assert.strictEqual(
        info.mock.calls[0].arguments[0],
        'Checking if main exists...'
      )
      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(
        setFailed.mock.calls[0].arguments[0],
        'The base branch main does not exist.'
      )
    })
  })

  describe('when a head branch does not exist', () => {
    it('should throw an error', async () => {
      const getInput = makeGetInput({
        base: 'main',
        head: 'my-branch-name',
        tag: ''
      })
      const setFailed = mock.fn()
      const info = mock.fn()

      let callIndex = 0
      getExecOutput.mock.mockImplementation(() => {
        const current = callIndex++
        if (current === 0) {
          return Promise.resolve({ exitCode: 0, stdout: 'hazaar!', stderr: '' })
        }
        throw { stdout: '' }
      })

      const core = { getInput, setFailed, info }

      await run(core as unknown as Core, github as unknown as Github)

      assert.strictEqual(info.mock.callCount(), 2)
      assert.strictEqual(
        info.mock.calls[1].arguments[0],
        'Checking if my-branch-name exists...'
      )
      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(
        setFailed.mock.calls[0].arguments[0],
        'The head branch my-branch-name does not exist.'
      )
    })
  })

  describe('when a tag does not exist', () => {
    it('should throw an error', async () => {
      const getInput = makeGetInput({ base: '', head: '', tag: 'v1.0.0' })
      const setFailed = mock.fn()
      const info = mock.fn()

      getExecOutput.mock.mockImplementation(() => {
        throw { stdout: '' }
      })

      const core = { getInput, setFailed, info }

      await run(core as unknown as Core, github as unknown as Github)

      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(
        setFailed.mock.calls[0].arguments[0],
        'The tag v1.0.0 does not exist.'
      )
    })
  })

  describe('when the base and head branches exist', () => {
    it('should set the output', async () => {
      const getInput = makeGetInput({
        base: 'main',
        head: 'my-branch-name',
        tag: ''
      })
      const setFailed = mock.fn()
      const setOutput = mock.fn()
      const info = mock.fn()

      let callIndex = 0
      getExecOutput.mock.mockImplementation(() => {
        const current = callIndex++

        switch (current) {
          // doesBranchExist (base)
          case 0:
            return Promise.resolve({
              exitCode: 0,
              stdout: 'hazaar!',
              stderr: ''
            })
          // doesBranchExist (head)
          case 1:
            return Promise.resolve({
              exitCode: 0,
              stdout: 'hazaar!',
              stderr: ''
            })
          // getRawCommitList
          case 2:
            return Promise.resolve({
              exitCode: 0,
              stdout: rawCommitList,
              stderr: ''
            })
          // getFallbackId 1st call
          case 3:
            return Promise.resolve({ stdout: '', stderr: '', exitCode: 0 })
          // getFallbackId 2nd call
          case 4:
            return Promise.resolve({ stdout: '456', stderr: '', exitCode: 0 })
          // getFallbackId 3rd call (unstubbed -> null)
          default:
            throw { stdout: '' }
        }
      })

      const core = { getInput, setFailed, setOutput, info }

      await run(core as unknown as Core, github as unknown as Github)

      assert.strictEqual(info.mock.callCount(), 7)
      assert.strictEqual(setOutput.mock.callCount(), 1)
      assert.strictEqual(setOutput.mock.calls[0].arguments[0], 'commit-list')

      const output = setOutput.mock.calls[0].arguments[1] as string
      assert.deepStrictEqual(JSON.parse(output), expectedParsedCommitList)
    })
  })

  describe('when the tag exists', () => {
    describe('and base and head are not provided', () => {
      it('should set the output', async () => {
        const getInput = makeGetInput({ base: '', head: '', tag: 'v1.0.0' })
        const setOutput = mock.fn()
        const info = mock.fn()

        let fallbackIndex = 0
        getExecOutput.mock.mockImplementation((cmd: string) => {
          // doesTagExist
          if (cmd === 'git rev-parse --verify v1.0.0') {
            return Promise.resolve({
              exitCode: 0,
              stderr: '',
              stdout: '46d3d9522335833c526af9f2eda0d988a8fe1bed'
            })
          }

          // getRawCommitList
          if (
            cmd === 'git log v1.0.0..HEAD --oneline --no-merges --abbrev-commit'
          ) {
            return Promise.resolve({
              exitCode: 0,
              stderr: '',
              stdout: rawCommitList
            })
          }

          // getFallbackId calls (cmd === 'git')
          const responses: Array<ExecOutput> = [
            { stdout: '', stderr: '', exitCode: 0 },
            { stdout: '456', stderr: '', exitCode: 0 },
            { stdout: '', stderr: '', exitCode: 0 }
          ]
          return Promise.resolve(
            responses[fallbackIndex++] ?? {
              stdout: '',
              stderr: '',
              exitCode: 0
            }
          )
        })

        const core = { getInput, setOutput, info }

        await run(core as unknown as Core, github as unknown as Github)

        assert.strictEqual(setOutput.mock.callCount(), 1)
        assert.strictEqual(setOutput.mock.calls[0].arguments[0], 'commit-list')

        const output = setOutput.mock.calls[0].arguments[1] as string
        assert.deepStrictEqual(JSON.parse(output), expectedParsedCommitList)
      })
    })
  })

  describe('when an unexpected error occurs', () => {
    it('catches the error', async () => {
      const setFailed = mock.fn()
      const core = {
        getInput() {
          throw new Error('BOOM!')
        },
        setFailed
      } as unknown as Core

      // We pass {} as we do not expect to use it in this test.
      await run(core, {} as unknown as Github)

      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(setFailed.mock.calls[0].arguments[0], 'BOOM!')
    })
  })
})
