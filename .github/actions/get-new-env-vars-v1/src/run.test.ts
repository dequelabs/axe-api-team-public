import { describe, it, beforeEach, mock } from 'node:test'
import { strict as assert } from 'node:assert'
import type { Core } from './types'

type ExecOutput = { stdout: string; stderr: string; exitCode: number }

const getExecOutput = mock.fn<(cmd: string) => ExecOutput>(() => ({
  stdout: '',
  stderr: '',
  exitCode: 0
}))
mock.module('@actions/exec', { namedExports: { getExecOutput } })

const { default: run } = await import('./run.ts')

function makeCore(inputs: Record<string, string>) {
  const getInput = mock.fn((name: string, opts?: { required?: boolean }) => {
    if (name === 'env-file-path' && opts?.required && !inputs[name]) {
      throw new Error('Input required and not supplied: env-file-path')
    }
    return inputs[name] ?? ''
  })
  const setFailed = mock.fn()
  const setOutput = mock.fn()
  const info = mock.fn()
  const core = {
    getInput,
    setFailed,
    setOutput,
    info
  } as unknown as Core
  return { core, getInput, setFailed, setOutput, info }
}

describe('run', () => {
  beforeEach(() => {
    getExecOutput.mock.resetCalls()
    getExecOutput.mock.mockImplementation(() => ({
      stdout: '',
      stderr: '',
      exitCode: 0
    }))
  })

  describe('inputs', () => {
    describe('when `env-file-path` is not provided', () => {
      it('throws an error', async () => {
        const { core, setFailed } = makeCore({})

        await run(core)

        assert.strictEqual(setFailed.mock.callCount(), 1)
        assert.strictEqual(
          setFailed.mock.calls[0].arguments[0],
          'Input required and not supplied: env-file-path'
        )
      })
    })

    describe('`head`', () => {
      describe('when provided', () => {
        it('uses the provided value', async () => {
          const { core, info } = makeCore({
            'env-file-path': '.env',
            head: 'my-cool-branch'
          })

          await run(core)

          assert.strictEqual(
            info.mock.calls[0].arguments[0],
            'Finding new env vars from my-cool-branch to master...'
          )
        })
      })

      describe('when not provided', () => {
        it('defaults to `release`', async () => {
          const { core, info } = makeCore({
            'env-file-path': '.env',
            head: ''
          })

          await run(core)

          assert.strictEqual(
            info.mock.calls[0].arguments[0],
            'Finding new env vars from release to master...'
          )
        })
      })
    })

    describe('`base`', () => {
      describe('when provided', () => {
        it('uses the provided value', async () => {
          const { core, info } = makeCore({
            'env-file-path': '.env',
            base: 'my-other-cool-branch'
          })

          await run(core)

          assert.strictEqual(
            info.mock.calls[0].arguments[0],
            'Finding new env vars from release to my-other-cool-branch...'
          )
        })
      })

      describe('when not provided', () => {
        it('defaults to `master`', async () => {
          const { core, info } = makeCore({
            'env-file-path': '.env',
            base: ''
          })

          await run(core)

          assert.strictEqual(
            info.mock.calls[0].arguments[0],
            'Finding new env vars from release to master...'
          )
        })
      })
    })
  })

  describe('`git diff` command', () => {
    describe('when the command throws a non-zero exit code', () => {
      it('catches the error', async () => {
        getExecOutput.mock.mockImplementation(() => ({
          stdout: '',
          stderr: 'Some error',
          exitCode: 1
        }))

        const { core, setFailed } = makeCore({ 'env-file-path': '.env' })

        await run(core)

        assert.strictEqual(setFailed.mock.callCount(), 1)
        assert.strictEqual(
          setFailed.mock.calls[0].arguments[0],
          'Error getting env vars: \nSome error'
        )
      })
    })

    describe('when the command succeeds', () => {
      describe('and there are no new env vars', () => {
        it('does not set the `new-env-vars` output', async () => {
          getExecOutput.mock.mockImplementation(() => ({
            stdout: '',
            stderr: '',
            exitCode: 0
          }))

          const { core, setOutput } = makeCore({ 'env-file-path': '.env' })

          await run(core)

          assert.strictEqual(setOutput.mock.callCount(), 0)
        })
      })

      describe('and there are new env vars', () => {
        describe('and they are commented out', () => {
          it('does not set the `new-env-vars` output', async () => {
            getExecOutput.mock.mockImplementation(() => ({
              stdout: `+#FOO=bar \n+#BAR=baz \n # I AM A COMMENT!`,
              stderr: '',
              exitCode: 0
            }))

            const { core, setOutput } = makeCore({ 'env-file-path': '.env' })

            await run(core)

            assert.strictEqual(setOutput.mock.callCount(), 0)
          })
        })

        describe('and they are not commented out', () => {
          it('sets the `new-env-vars` output', async () => {
            getExecOutput.mock.mockImplementation(() => ({
              stdout: `+ FOO=bar \n+ BAR=baz`,
              stderr: '',
              exitCode: 0
            }))

            const { core, setOutput } = makeCore({ 'env-file-path': '.env' })

            await run(core)

            assert.strictEqual(setOutput.mock.callCount(), 1)
            assert.strictEqual(
              setOutput.mock.calls[0].arguments[0],
              'new-env-vars'
            )
            assert.strictEqual(setOutput.mock.calls[0].arguments[1], 'FOO,BAR')
          })
        })
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

      await run(core)

      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(setFailed.mock.calls[0].arguments[0], 'BOOM!')
    })
  })
})
