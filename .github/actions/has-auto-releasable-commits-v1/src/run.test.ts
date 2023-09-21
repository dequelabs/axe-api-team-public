import 'mocha'
import { assert } from 'chai'
import sinon from 'sinon'
import type { Core } from './types'
import run from './run'

describe('run', () => {
  let setFailed: sinon.SinonSpy
  let setOutput: sinon.SinonSpy
  let getInput: sinon.SinonStub
  let info: sinon.SinonSpy

  beforeEach(() => {
    setFailed = sinon.spy()
    setOutput = sinon.spy()
    info = sinon.spy()
    getInput = sinon.stub()
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('when commits input is not provided', () => {
    it('should throw an error', async () => {
      getInput.withArgs('commits', { required: true }).throws({
        message: 'Input required and not supplied: commits'
      })

      const core = {
        getInput,
        setFailed
      }

      await run(core as unknown as Core)

      assert.isTrue(setFailed.calledOnce)
      assert.isTrue(
        setFailed.calledWith('Input required and not supplied: commits')
      )
    })
  })

  describe('when version-locked input is not provided', () => {
    it('should throw an error', async () => {
      getInput.withArgs('commits', { required: true }).returns('[]')
      getInput.withArgs('version-locked', { required: true }).throws({
        message: 'Input required and not supplied: version-locked'
      })

      const core = {
        getInput,
        setFailed
      }

      await run(core as unknown as Core)

      assert.isTrue(setFailed.calledOnce)
      assert.isTrue(
        setFailed.calledWith('Input required and not supplied: version-locked')
      )
    })
  })

  describe('when version-locked input is not true or false', () => {
    it('should throw an error', async () => {
      getInput.withArgs('commits', { required: true }).returns('[]')
      getInput.withArgs('version-locked', { required: true }).returns('foo')

      const core = {
        getInput,
        setFailed
      }

      await run(core as unknown as Core)

      assert.isTrue(setFailed.calledOnce)
      assert.isTrue(
        setFailed.calledWith(
          'Invalid value for version-locked: foo. Must be true or false'
        )
      )
    })
  })

  describe('when version-locked input is false', () => {
    describe('and there are no commits', () => {
      it('should set should-release to false', async () => {
        getInput.withArgs('commits', { required: true }).returns('[]')
        getInput.withArgs('version-locked', { required: true }).returns('false')

        const core = {
          getInput,
          setOutput,
          info
        }
        await run(core as unknown as Core)

        assert.isTrue(setOutput.calledOnce)
        assert.isTrue(setOutput.calledWith('should-release', false))
        assert.isTrue(info.calledOnce)
        assert.isTrue(
          info.calledWith('Setting output "should-release" to false')
        )
      })
    })

    describe('and there are no feat or fix commits', () => {
      it('should set should-release to false', async () => {
        getInput.withArgs('commits', { required: true }).returns(
          JSON.stringify([
            {
              commit: '061acd5 refactor(scope): some refactor (#664)',
              title: 'refactor(scope): some refactor (#664)',
              sha: '061acd5',
              type: 'refactor',
              id: '664',
              link: 'something'
            }
          ])
        )
        getInput.withArgs('version-locked', { required: true }).returns('false')

        const core = {
          getInput,
          setOutput,
          info
        }

        await run(core as unknown as Core)

        assert.isTrue(setOutput.calledOnce)
        assert.isTrue(setOutput.calledWith('should-release', false))
        assert.isTrue(info.calledOnce)
        assert.isTrue(
          info.calledWith('Setting output "should-release" to false')
        )
      })
    })

    describe('and there are feat or fix commits', () => {
      it('should set should-release to true', async () => {
        getInput.withArgs('commits', { required: true }).returns(
          JSON.stringify([
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
        )
        getInput.withArgs('version-locked', { required: true }).returns('false')

        const core = {
          getInput,
          setOutput,
          info
        }

        await run(core as unknown as Core)

        assert.isTrue(setOutput.calledOnce)
        assert.isTrue(setOutput.calledWith('should-release', true))
        assert.isTrue(info.calledOnce)
        assert.isTrue(
          info.calledWith('Setting output "should-release" to true')
        )
      })
    })
  })

  describe('when version-locked input is true', () => {
    describe('and there are no commits', () => {
      it('should set should-release to false', async () => {
        getInput.withArgs('commits', { required: true }).returns('[]')
        getInput.withArgs('version-locked', { required: true }).returns('true')

        const core = {
          getInput,
          setOutput,
          info
        }

        await run(core as unknown as Core)

        assert.isTrue(setOutput.calledOnce)
        assert.isTrue(setOutput.calledWith('should-release', false))
        assert.isTrue(info.calledOnce)
        assert.isTrue(
          info.calledWith('Setting output "should-release" to false')
        )
      })
    })

    describe('and there are no breaking changes', () => {
      describe('and there are no major or minor changes for axe-core', () => {
        describe('and there are no feat or fix commits', () => {
          it('should set should-release to false', async () => {
            getInput.withArgs('commits', { required: true }).returns(
              JSON.stringify([
                {
                  commit: '061acd5 refactor(scope): some refactor (#664)',
                  title: 'refactor(scope): some refactor (#664)',
                  sha: '061acd5',
                  type: 'refactor',
                  id: '664',
                  link: 'something'
                }
              ])
            )
            getInput
              .withArgs('version-locked', { required: true })
              .returns('true')

            const core = {
              getInput,
              setOutput,
              info
            }

            await run(core as unknown as Core)

            assert.isTrue(setOutput.calledOnce)
            assert.isTrue(setOutput.calledWith('should-release', false))
            assert.isTrue(info.calledOnce)
            assert.isTrue(
              info.calledWith('Setting output "should-release" to false')
            )
          })
        })

        describe('and there are feat or fix commits', () => {
          it('should set should-release to true', async () => {
            getInput.withArgs('commits', { required: true }).returns(
              JSON.stringify([
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
            )
            getInput
              .withArgs('version-locked', { required: true })
              .returns('true')

            const core = {
              getInput,
              setOutput,
              info
            }

            await run(core as unknown as Core)

            assert.isTrue(setOutput.calledOnce)
            assert.isTrue(setOutput.calledWith('should-release', true))
            assert.isTrue(info.calledOnce)
            assert.isTrue(
              info.calledWith('Setting output "should-release" to true')
            )
          })
        })

        describe('and `version-locked` is received as uppercase TRUE', () => {
          it('should set should-release to true', async () => {
            getInput.withArgs('commits', { required: true }).returns(
              JSON.stringify([
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
            )
            getInput
              .withArgs('version-locked', { required: true })
              .returns('TRUE')

            const core = {
              getInput,
              setOutput,
              info
            }

            await run(core as unknown as Core)

            assert.isTrue(setOutput.calledOnce)
            assert.isTrue(setOutput.calledWith('should-release', true))
            assert.isTrue(info.calledOnce)
            assert.isTrue(
              info.calledWith('Setting output "should-release" to true')
            )
          })
        })
      })

      describe('and there are major or minor changes for axe-core', () => {
        describe('and there are feat or fix commits', () => {
          it('should set should-release to false', async () => {
            getInput.withArgs('commits', { required: true }).returns(
              JSON.stringify([
                {
                  commit: '061acd5 feat(scope): update axe-core to (#664)',
                  title: 'feat(scope): update axe-core to (#664)',
                  sha: '061acd5',
                  type: 'feat',
                  id: '664',
                  link: 'something'
                }
              ])
            )
            getInput
              .withArgs('version-locked', { required: true })
              .returns('true')

            const core = {
              getInput,
              setOutput,
              info
            }

            await run(core as unknown as Core)

            assert.isTrue(setOutput.calledOnce)
            assert.isTrue(setOutput.calledWith('should-release', false))
            assert.isTrue(info.calledOnce)
            assert.isTrue(
              info.calledWith('Setting output "should-release" to false')
            )
          })
        })
      })
    })
  })
})
