import { describe, it, beforeEach, mock } from 'node:test'
import { strict as assert } from 'node:assert'
import type { Core, GitHub } from './types'

type ExecOutput = { stdout: string; stderr: string; exitCode: number }

const getExecOutput = mock.fn<(cmd: string) => ExecOutput>(() => ({
  stdout: '',
  stderr: '',
  exitCode: 0
}))
mock.module('@actions/exec', { namedExports: { getExecOutput } })

const { default: run } = await import('./run.ts')

function makeCore(inputs: Record<string, string>) {
  const getInput = mock.fn((name: string) => inputs[name] ?? '')
  const setFailed = mock.fn()
  const setOutput = mock.fn()
  const info = mock.fn()
  const warning = mock.fn()
  const core = {
    getInput,
    setFailed,
    setOutput,
    info,
    warning
  } as unknown as Core
  return { core, getInput, setFailed, setOutput, info, warning }
}

const githubFor = (owner: string, repo: string): GitHub =>
  ({ context: { repo: { owner, repo } } }) as GitHub

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
    describe('version', () => {
      describe('when not provided', () => {
        it('throws an error', async () => {
          const setFailed = mock.fn()
          const core = {
            getInput: mock.fn((name: string) => {
              if (name === 'version') {
                throw new Error('Input required and not supplied: version')
              }
              return ''
            }),
            setFailed
          } as unknown as Core

          await run(core, {} as GitHub)

          assert.strictEqual(setFailed.mock.callCount(), 1)
          assert.strictEqual(
            setFailed.mock.calls[0].arguments[0],
            'Input required and not supplied: version'
          )
        })
      })
    })

    describe('owner', () => {
      describe('when provided', () => {
        it('uses the provided value', async () => {
          const { core, info } = makeCore({
            version: '1.0.0',
            owner: 'new-owner',
            repo: 'repo'
          })

          await run(core, githubFor('owner', 'repo'))

          assert.strictEqual(info.mock.callCount(), 1)
          assert.strictEqual(
            info.mock.calls[0].arguments[0],
            'Getting issues for new-owner/repo...'
          )
        })
      })

      describe('when not provided', () => {
        it('uses the context value', async () => {
          const { core, info } = makeCore({
            version: '1.0.0',
            owner: '',
            repo: 'repo'
          })

          await run(core, githubFor('owner', 'repo'))

          assert.strictEqual(info.mock.callCount(), 1)
          assert.strictEqual(
            info.mock.calls[0].arguments[0],
            'Getting issues for owner/repo...'
          )
        })
      })
    })

    describe('repo', () => {
      describe('when provided', () => {
        it('uses the provided value', async () => {
          const { core, info } = makeCore({
            version: '1.0.0',
            owner: 'owner',
            repo: 'new-repo'
          })

          await run(core, githubFor('owner', 'repo'))

          assert.strictEqual(info.mock.callCount(), 1)
          assert.strictEqual(
            info.mock.calls[0].arguments[0],
            'Getting issues for owner/new-repo...'
          )
        })
      })

      describe('when not provided', () => {
        it('uses the context value', async () => {
          const { core, info } = makeCore({
            version: '1.0.0',
            owner: 'owner',
            repo: ''
          })

          await run(core, githubFor('owner', 'repo'))

          assert.strictEqual(info.mock.callCount(), 1)
          assert.strictEqual(
            info.mock.calls[0].arguments[0],
            'Getting issues for owner/repo...'
          )
        })
      })
    })
  })

  describe('when listing issues', () => {
    describe('throws a non-zero exit code', () => {
      it('catches the error', async () => {
        getExecOutput.mock.mockImplementation(() => ({
          stdout: '',
          stderr: 'BOOM',
          exitCode: 1
        }))

        const { core, setFailed } = makeCore({
          version: '1.0.0',
          owner: 'owner',
          repo: 'repo'
        })

        await run(core, githubFor('owner', 'repo'))

        assert.strictEqual(setFailed.mock.callCount(), 1)
        assert.strictEqual(
          setFailed.mock.calls[0].arguments[0],
          'Error getting issues: \nBOOM'
        )
      })
    })

    describe('succeeds', () => {
      it('calls gh issue list with the correct arguments', async () => {
        const { core } = makeCore({ version: '1.0.0', owner: '', repo: '' })

        await run(core, githubFor('owner', 'repo'))

        assert.strictEqual(getExecOutput.mock.callCount(), 1)
        assert.strictEqual(
          getExecOutput.mock.calls[0].arguments[0],
          'gh issue list --repo owner/repo --label release --state open --json url,title --search "owner/repo v1.0.0"'
        )
      })
    })

    describe('when passed owner and repo', () => {
      it('calls gh issue list with the correct arguments', async () => {
        const { core } = makeCore({
          version: '1.0.0',
          owner: 'other-owner',
          repo: 'docs'
        })

        await run(core, githubFor('owner', 'actual-repo'))

        assert.strictEqual(getExecOutput.mock.callCount(), 1)
        assert.strictEqual(
          getExecOutput.mock.calls[0].arguments[0],
          'gh issue list --repo other-owner/docs --label release --state open --json url,title --search "owner/actual-repo v1.0.0"'
        )
      })
    })

    describe('when no issues are found', () => {
      it('warns the user', async () => {
        getExecOutput.mock.mockImplementation(() => ({
          stdout: '[]',
          stderr: '',
          exitCode: 0
        }))

        const { core, warning } = makeCore({
          version: '1.0.0',
          owner: 'owner',
          repo: 'repo'
        })

        await run(core, githubFor('owner', 'repo'))

        assert.strictEqual(warning.mock.callCount(), 1)
        assert.strictEqual(
          warning.mock.calls[0].arguments[0],
          'No issues found for owner/repo v1.0.0. It may have already been closed...'
        )
      })

      it('sets the issue-url output to null', async () => {
        getExecOutput.mock.mockImplementation(() => ({
          stdout: '[]',
          stderr: '',
          exitCode: 0
        }))

        const { core, setOutput } = makeCore({
          version: '1.0.0',
          owner: 'owner',
          repo: 'repo'
        })

        await run(core, githubFor('owner', 'repo'))

        assert.strictEqual(setOutput.mock.callCount(), 1)
        assert.strictEqual(setOutput.mock.calls[0].arguments[0], 'issue-url')
        assert.strictEqual(setOutput.mock.calls[0].arguments[1], null)
      })
    })

    describe('when more than one issue is found', () => {
      it('throws an error', async () => {
        getExecOutput.mock.mockImplementation(() => ({
          stdout:
            '[{"url":"url1","title":"title1"},{"url":"url2","title":"title2"}]',
          stderr: '',
          exitCode: 0
        }))

        const { core, setFailed } = makeCore({
          version: '1.0.0',
          owner: 'owner',
          repo: 'repo'
        })

        await run(core, githubFor('owner', 'repo'))

        assert.strictEqual(setFailed.mock.callCount(), 1)
        assert.strictEqual(
          setFailed.mock.calls[0].arguments[0],
          'Found 2 issues for owner/repo v1.0.0. Please manually verify...'
        )
      })
    })

    describe('when one issue is found', () => {
      it('sets the issue-url output', async () => {
        getExecOutput.mock.mockImplementation(() => ({
          stdout: '[{"url":"url1","title":"title1"}]',
          stderr: '',
          exitCode: 0
        }))

        const { core, setOutput } = makeCore({
          version: '1.0.0',
          owner: 'owner',
          repo: 'repo'
        })

        await run(core, githubFor('owner', 'repo'))

        assert.strictEqual(setOutput.mock.callCount(), 1)
        assert.strictEqual(setOutput.mock.calls[0].arguments[0], 'issue-url')
        assert.strictEqual(setOutput.mock.calls[0].arguments[1], 'url1')
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

      await run(core, githubFor('owner', 'repo'))

      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(setFailed.mock.calls[0].arguments[0], 'BOOM!')
    })
  })
})
