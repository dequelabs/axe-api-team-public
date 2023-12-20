import 'mocha'
import { assert } from 'chai'
import sinon from 'sinon'
import * as exec from '@actions/exec'
import type { Core } from './types'
import run from './run'

describe('run', () => {
  let execStub: sinon.SinonStub
  let inputStub: sinon.SinonStub
  let setFailedSpy: sinon.SinonSpy
  let setOutputSpy: sinon.SinonSpy
  let infoSpy: sinon.SinonSpy

  beforeEach(() => {
    execStub = sinon.stub(exec, 'getExecOutput')
    inputStub = sinon.stub()
    setFailedSpy = sinon.spy()
    setOutputSpy = sinon.spy()
    infoSpy = sinon.spy()
  })

  afterEach(sinon.restore)

  describe('inputs', () => {
    describe('when `env-file-path` is not provided', () => {
      it('throws an error', async () => {
        inputStub.withArgs('env-file-path', { required: true }).throws({
          message: 'Input required and not supplied: env-file-path'
        })

        const core = {
          getInput: inputStub,
          setFailed: setFailedSpy
        } as unknown as Core

        await run(core)

        assert.isTrue(setFailedSpy.calledOnce)
        assert.isTrue(
          setFailedSpy.calledWith(
            'Input required and not supplied: env-file-path'
          )
        )
      })
    })

    describe('`head`', () => {
      describe('when provided', () => {
        it('uses the provided value', async () => {
          inputStub
            .withArgs('env-file-path', { required: true })
            .returns('.env')
          inputStub.withArgs('head').returns('my-cool-branch')

          const core = {
            getInput: inputStub,
            info: infoSpy,
            setFailed: setFailedSpy
          } as unknown as Core

          await run(core)

          assert.isTrue(infoSpy.calledOnce)
          assert.isTrue(
            infoSpy.calledWith(
              'Finding new env vars from my-cool-branch to main...'
            )
          )
        })
      })

      describe('when not provided', () => {
        it('defaults to `release`', async () => {
          inputStub
            .withArgs('env-file-path', { required: true })
            .returns('.env')
          inputStub.withArgs('head').returns('')

          const core = {
            getInput: inputStub,
            info: infoSpy,
            setFailed: setFailedSpy
          } as unknown as Core

          await run(core)

          assert.isTrue(infoSpy.calledOnce)
          assert.isTrue(
            infoSpy.calledWith('Finding new env vars from release to main...')
          )
        })
      })
    })

    describe('`base`', () => {
      describe('when provided', () => {
        it('uses the provided value', async () => {
          inputStub
            .withArgs('env-file-path', { required: true })
            .returns('.env')
          inputStub.withArgs('base').returns('my-other-cool-branch')

          const core = {
            getInput: inputStub,
            info: infoSpy,
            setFailed: setFailedSpy
          } as unknown as Core

          await run(core)

          assert.isTrue(infoSpy.calledOnce)
          assert.isTrue(
            infoSpy.calledWith(
              'Finding new env vars from release to my-other-cool-branch...'
            )
          )
        })
      })

      describe('when not provided', () => {
        it('defaults to `main`', async () => {
          inputStub
            .withArgs('env-file-path', { required: true })
            .returns('.env')
          inputStub.withArgs('base').returns('')

          const core = {
            getInput: inputStub,
            info: infoSpy,
            setFailed: setFailedSpy
          } as unknown as Core

          await run(core)

          assert.isTrue(infoSpy.calledOnce)
          assert.isTrue(
            infoSpy.calledWith('Finding new env vars from release to main...')
          )
        })
      })
    })
  })

  describe('`git diff` command', () => {
    describe('when the command throws a non-zero exit code', () => {
      it('catches the error', async () => {
        inputStub.withArgs('env-file-path', { required: true }).returns('.env')
        execStub.returns({
          stdout: '',
          stderr: 'Some error',
          exitCode: 1
        })

        const core = {
          getInput: inputStub,
          info: infoSpy,
          setFailed: setFailedSpy
        } as unknown as Core

        await run(core)

        assert.isTrue(setFailedSpy.calledOnce)
        assert.isTrue(
          setFailedSpy.calledWith('Error getting env vars: \nSome error')
        )
      })
    })

    describe('when the command succeeds', () => {
      describe('and there are no new env vars', () => {
        it('does not set the `env-vars` output', async () => {
          inputStub
            .withArgs('env-file-path', { required: true })
            .returns('.env')
          execStub.returns({
            stdout: '',
            stderr: '',
            exitCode: 0
          })

          const core = {
            getInput: inputStub,
            info: infoSpy,
            setFailed: setFailedSpy,
            setOutput: setOutputSpy
          } as unknown as Core

          await run(core)

          assert.isTrue(setOutputSpy.notCalled)
        })
      })

      describe('and there are new env vars', () => {
        describe('and they are commented out', () => {
          it('does not set the `env-vars` output', async () => {
            inputStub
              .withArgs('env-file-path', { required: true })
              .returns('.env')

            execStub.returns({
              stdout: `+#FOO=bar \n+#BAR=baz \n # I AM A COMMENT!`,
              stderr: '',
              exitCode: 0
            })

            const core = {
              getInput: inputStub,
              info: infoSpy,
              setFailed: setFailedSpy,
              setOutput: setOutputSpy
            } as unknown as Core

            await run(core)

            assert.isTrue(setOutputSpy.notCalled)
          })
        })

        describe('and they are not commented out', () => {
          it('sets the `env-vars` output', async () => {
            inputStub
              .withArgs('env-file-path', { required: true })
              .returns('.env')

            execStub.returns({
              stdout: `+ FOO=bar \n+ BAR=baz`,
              stderr: '',
              exitCode: 0
            })

            const core = {
              getInput: inputStub,
              info: infoSpy,
              setFailed: setFailedSpy,
              setOutput: setOutputSpy
            } as unknown as Core

            await run(core)

            assert.isTrue(setOutputSpy.calledOnce)
            assert.isTrue(setOutputSpy.calledWith('new-env-vars', 'FOO,BAR'))
          })
        })
      })
    })
  })

  describe('when an unexpected error occurs', () => {
    it('catches the error', async () => {
      const core = {
        getInput() {
          throw new Error('BOOM!')
        },
        setFailed: setFailedSpy
      } as unknown as Core

      await run(core)

      assert.isTrue(setFailedSpy.calledOnce)
      assert.isTrue(setFailedSpy.calledWith('BOOM!'))
    })
  })
})
