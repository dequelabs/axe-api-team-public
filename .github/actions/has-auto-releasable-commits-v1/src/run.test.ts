import { describe, it, beforeEach, mock } from 'node:test'
import { strict as assert } from 'node:assert'
import type { Core } from './types.ts'
import run from './run.ts'

type GetInputArgs = [name: string, options?: { required?: boolean }]

describe('run', () => {
  let setFailed: ReturnType<typeof mock.fn>
  let setOutput: ReturnType<typeof mock.fn>
  let getInput: ReturnType<typeof mock.fn<(...args: GetInputArgs) => string>>
  let info: ReturnType<typeof mock.fn>

  beforeEach(() => {
    setFailed = mock.fn()
    setOutput = mock.fn()
    info = mock.fn()
    getInput = mock.fn<(...args: GetInputArgs) => string>()
  })

  describe('when commits input is not provided', () => {
    it('should throw an error', async () => {
      getInput.mock.mockImplementation((name: string) => {
        if (name === 'commits') {
          throw new Error('Input required and not supplied: commits')
        }
        return ''
      })

      const core = {
        getInput,
        setFailed
      }

      await run(core as unknown as Core)

      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(
        setFailed.mock.calls[0].arguments[0],
        'Input required and not supplied: commits'
      )
    })
  })

  describe('when version-locked input is not provided', () => {
    it('should throw an error', async () => {
      getInput.mock.mockImplementation((name: string) => {
        if (name === 'commits') {
          return '[]'
        }
        if (name === 'version-locked') {
          throw new Error('Input required and not supplied: version-locked')
        }
        return ''
      })

      const core = {
        getInput,
        setFailed
      }

      await run(core as unknown as Core)

      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(
        setFailed.mock.calls[0].arguments[0],
        'Input required and not supplied: version-locked'
      )
    })
  })

  describe('when version-locked input is not true or false', () => {
    it('should throw an error', async () => {
      getInput.mock.mockImplementation((name: string) => {
        if (name === 'commits') {
          return '[]'
        }
        if (name === 'version-locked') {
          return 'foo'
        }
        return ''
      })

      const core = {
        getInput,
        setFailed
      }

      await run(core as unknown as Core)

      assert.strictEqual(setFailed.mock.callCount(), 1)
      assert.strictEqual(
        setFailed.mock.calls[0].arguments[0],
        'Invalid value for version-locked: foo. Must be true or false'
      )
    })
  })

  describe('when version-locked input is false', () => {
    describe('and there are no commits', () => {
      it('should set should-release to false', async () => {
        getInput.mock.mockImplementation((name: string) => {
          if (name === 'commits') {
            return '[]'
          }
          if (name === 'version-locked') {
            return 'false'
          }
          return ''
        })

        const core = {
          getInput,
          setOutput,
          info
        }
        await run(core as unknown as Core)

        assert.strictEqual(setOutput.mock.callCount(), 1)
        assert.strictEqual(
          setOutput.mock.calls[0].arguments[0],
          'should-release'
        )
        assert.strictEqual(setOutput.mock.calls[0].arguments[1], false)
        assert.strictEqual(info.mock.callCount(), 1)
        assert.strictEqual(
          info.mock.calls[0].arguments[0],
          'Setting output "should-release" to false'
        )
      })
    })

    describe('and there are no feat or fix commits', () => {
      it('should set should-release to false', async () => {
        getInput.mock.mockImplementation((name: string) => {
          if (name === 'commits') {
            return JSON.stringify([
              {
                commit: '061acd5 refactor(scope): some refactor (#664)',
                title: 'refactor(scope): some refactor (#664)',
                sha: '061acd5',
                type: 'refactor',
                id: '664',
                link: 'something'
              }
            ])
          }
          if (name === 'version-locked') {
            return 'false'
          }
          return ''
        })

        const core = {
          getInput,
          setOutput,
          info
        }

        await run(core as unknown as Core)

        assert.strictEqual(setOutput.mock.callCount(), 1)
        assert.strictEqual(
          setOutput.mock.calls[0].arguments[0],
          'should-release'
        )
        assert.strictEqual(setOutput.mock.calls[0].arguments[1], false)
        assert.strictEqual(info.mock.callCount(), 1)
        assert.strictEqual(
          info.mock.calls[0].arguments[0],
          'Setting output "should-release" to false'
        )
      })
    })

    describe('and there are feat or fix commits', () => {
      it('should set should-release to true', async () => {
        getInput.mock.mockImplementation((name: string) => {
          if (name === 'commits') {
            return JSON.stringify([
              {
                commit: '061acd5 refactor(scope): some refactor (#664)',
                title: 'refactor(scope): some refactor (#664)',
                sha: '061acd5',
                type: 'refactor',
                id: '664',
                link: 'something'
              },
              {
                commit: '061acd5 feat(scope): some feature (#664)',
                title: 'feat(scope): some feature (#664)',
                sha: '061acd5',
                type: 'feat',
                id: '664',
                link: 'something'
              }
            ])
          }
          if (name === 'version-locked') {
            return 'false'
          }
          return ''
        })

        const core = {
          getInput,
          setOutput,
          info
        }

        await run(core as unknown as Core)

        assert.strictEqual(setOutput.mock.callCount(), 1)
        assert.strictEqual(
          setOutput.mock.calls[0].arguments[0],
          'should-release'
        )
        assert.strictEqual(setOutput.mock.calls[0].arguments[1], true)
        assert.strictEqual(info.mock.callCount(), 1)
        assert.strictEqual(
          info.mock.calls[0].arguments[0],
          'Setting output "should-release" to true'
        )
      })
    })
  })

  describe('when version-locked input is true', () => {
    describe('and there are no commits', () => {
      it('should set should-release to false', async () => {
        getInput.mock.mockImplementation((name: string) => {
          if (name === 'commits') {
            return '[]'
          }
          if (name === 'version-locked') {
            return 'true'
          }
          return ''
        })

        const core = {
          getInput,
          setOutput,
          info
        }

        await run(core as unknown as Core)

        assert.strictEqual(setOutput.mock.callCount(), 1)
        assert.strictEqual(
          setOutput.mock.calls[0].arguments[0],
          'should-release'
        )
        assert.strictEqual(setOutput.mock.calls[0].arguments[1], false)
        assert.strictEqual(info.mock.callCount(), 1)
        assert.strictEqual(
          info.mock.calls[0].arguments[0],
          'Setting output "should-release" to false'
        )
      })
    })

    describe('and there are no breaking changes', () => {
      describe('and there are no major or minor changes for axe-core', () => {
        describe('and there are no feat or fix commits', () => {
          it('should set should-release to false', async () => {
            getInput.mock.mockImplementation((name: string) => {
              if (name === 'commits') {
                return JSON.stringify([
                  {
                    commit: '061acd5 refactor(scope): some refactor (#664)',
                    title: 'refactor(scope): some refactor (#664)',
                    sha: '061acd5',
                    type: 'refactor',
                    id: '664',
                    link: 'something'
                  }
                ])
              }
              if (name === 'version-locked') {
                return 'true'
              }
              return ''
            })

            const core = {
              getInput,
              setOutput,
              info
            }

            await run(core as unknown as Core)

            assert.strictEqual(setOutput.mock.callCount(), 1)
            assert.strictEqual(
              setOutput.mock.calls[0].arguments[0],
              'should-release'
            )
            assert.strictEqual(setOutput.mock.calls[0].arguments[1], false)
            assert.strictEqual(info.mock.callCount(), 1)
            assert.strictEqual(
              info.mock.calls[0].arguments[0],
              'Setting output "should-release" to false'
            )
          })
        })

        describe('and there are feat or fix commits', () => {
          it('should set should-release to true', async () => {
            getInput.mock.mockImplementation((name: string) => {
              if (name === 'commits') {
                return JSON.stringify([
                  {
                    commit: '061acd5 refactor(scope): some refactor (#664)',
                    title: 'refactor(scope): some refactor (#664)',
                    sha: '061acd5',
                    type: 'refactor',
                    id: '664',
                    link: 'something'
                  },
                  {
                    commit: '061acd5 feat(scope): some feature (#664)',
                    title: 'feat(scope): some feature (#664)',
                    sha: '061acd5',
                    type: 'feat',
                    id: '664',
                    link: 'something'
                  }
                ])
              }
              if (name === 'version-locked') {
                return 'true'
              }
              return ''
            })

            const core = {
              getInput,
              setOutput,
              info
            }

            await run(core as unknown as Core)

            assert.strictEqual(setOutput.mock.callCount(), 1)
            assert.strictEqual(
              setOutput.mock.calls[0].arguments[0],
              'should-release'
            )
            assert.strictEqual(setOutput.mock.calls[0].arguments[1], true)
            assert.strictEqual(info.mock.callCount(), 1)
            assert.strictEqual(
              info.mock.calls[0].arguments[0],
              'Setting output "should-release" to true'
            )
          })
        })

        describe('and `version-locked` is received as uppercase TRUE', () => {
          it('should set should-release to true', async () => {
            getInput.mock.mockImplementation((name: string) => {
              if (name === 'commits') {
                return JSON.stringify([
                  {
                    commit: '061acd5 refactor(scope): some refactor (#664)',
                    title: 'refactor(scope): some refactor (#664)',
                    sha: '061acd5',
                    type: 'refactor',
                    id: '664',
                    link: 'something'
                  },
                  {
                    commit: '061acd5 feat(scope): some feature (#664)',
                    title: 'feat(scope): some feature (#664)',
                    sha: '061acd5',
                    type: 'feat',
                    id: '664',
                    link: 'something'
                  }
                ])
              }
              if (name === 'version-locked') {
                return 'TRUE'
              }
              return ''
            })

            const core = {
              getInput,
              setOutput,
              info
            }

            await run(core as unknown as Core)

            assert.strictEqual(setOutput.mock.callCount(), 1)
            assert.strictEqual(
              setOutput.mock.calls[0].arguments[0],
              'should-release'
            )
            assert.strictEqual(setOutput.mock.calls[0].arguments[1], true)
            assert.strictEqual(info.mock.callCount(), 1)
            assert.strictEqual(
              info.mock.calls[0].arguments[0],
              'Setting output "should-release" to true'
            )
          })
        })
      })

      describe('and there are major or minor changes for axe-core', () => {
        describe('and there are feat or fix commits', () => {
          it('should set should-release to false', async () => {
            getInput.mock.mockImplementation((name: string) => {
              if (name === 'commits') {
                return JSON.stringify([
                  {
                    commit: '061acd5 feat(scope): update axe-core to (#664)',
                    title: 'feat(scope): update axe-core to (#664)',
                    sha: '061acd5',
                    type: 'feat',
                    id: '664',
                    link: 'something'
                  }
                ])
              }
              if (name === 'version-locked') {
                return 'true'
              }
              return ''
            })

            const core = {
              getInput,
              setOutput,
              info
            }

            await run(core as unknown as Core)

            assert.strictEqual(setOutput.mock.callCount(), 1)
            assert.strictEqual(
              setOutput.mock.calls[0].arguments[0],
              'should-release'
            )
            assert.strictEqual(setOutput.mock.calls[0].arguments[1], false)
            assert.strictEqual(info.mock.callCount(), 1)
            assert.strictEqual(
              info.mock.calls[0].arguments[0],
              'Setting output "should-release" to false'
            )
          })
        })
      })
    })
  })
})
