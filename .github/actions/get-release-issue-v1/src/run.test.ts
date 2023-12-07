import 'mocha'
import sinon from 'sinon'
import { assert } from 'chai'
import * as exec from '@actions/exec'
import run from './run'
import type { Core, GitHub } from './types'

describe('run', () => {
  let execStub: sinon.SinonStub
  let inputStub: sinon.SinonStub
  let setFailedSpy: sinon.SinonSpy
  let setOutputSpy: sinon.SinonSpy
  let infoSpy: sinon.SinonSpy
  let warningSpy: sinon.SinonSpy

  beforeEach(() => {
    execStub = sinon.stub(exec, 'getExecOutput')
    inputStub = sinon.stub()
    setFailedSpy = sinon.spy()
    setOutputSpy = sinon.spy()
    infoSpy = sinon.spy()
    warningSpy = sinon.spy()
  })

  afterEach(sinon.restore)

  describe('inputs', () => {
    describe('version', () => {
      describe('when not provided', () => {
        it('throws an error', async () => {
          inputStub.withArgs('version', { required: true }).throws({
            message: 'Input required and not supplied: version'
          })

          const core = {
            getInput: inputStub,
            setFailed: setFailedSpy
          } as unknown as Core

          const github = {} as GitHub

          await run(core, github)

          assert.isTrue(setFailedSpy.calledOnce)
          assert.equal(
            setFailedSpy.args[0][0],
            'Input required and not supplied: version'
          )
        })
      })
    })

    describe('owner', () => {
      describe('when provided', () => {
        it('uses the provided value', async () => {
          inputStub.withArgs('version', { required: true }).returns('1.0.0')
          inputStub.withArgs('owner').returns('new-owner')
          inputStub.withArgs('repo').returns('repo')

          const core = {
            getInput: inputStub,
            setFailed: setFailedSpy,
            info: infoSpy
          } as unknown as Core

          const github = {
            context: {
              repo: {
                owner: 'owner',
                repo: 'repo'
              }
            }
          } as GitHub

          await run(core, github)

          assert.isTrue(infoSpy.calledOnce)
          assert.equal(
            infoSpy.args[0][0],
            'Getting issues for new-owner/repo...'
          )
        })
      })

      describe('when not provided', () => {
        it('uses the context value', async () => {
          inputStub.withArgs('version', { required: true }).returns('1.0.0')
          inputStub.withArgs('owner').returns('')
          inputStub.withArgs('repo').returns('repo')

          const core = {
            getInput: inputStub,
            setFailed: setFailedSpy,
            info: infoSpy
          } as unknown as Core

          const github = {
            context: {
              repo: {
                owner: 'owner',
                repo: 'repo'
              }
            }
          } as GitHub

          await run(core, github)

          assert.isTrue(infoSpy.calledOnce)
          assert.equal(infoSpy.args[0][0], 'Getting issues for owner/repo...')
        })
      })
    })

    describe('repo', () => {
      describe('when provided', () => {
        it('uses the provided value', async () => {
          inputStub.withArgs('version', { required: true }).returns('1.0.0')
          inputStub.withArgs('owner').returns('owner')
          inputStub.withArgs('repo').returns('new-repo')

          const core = {
            getInput: inputStub,
            setFailed: setFailedSpy,
            info: infoSpy
          } as unknown as Core

          const github = {
            context: {
              repo: {
                owner: 'owner',
                repo: 'repo'
              }
            }
          } as GitHub

          await run(core, github)

          assert.isTrue(infoSpy.calledOnce)
          assert.equal(
            infoSpy.args[0][0],
            'Getting issues for owner/new-repo...'
          )
        })
      })

      describe('when not provided', () => {
        it('uses the context value', async () => {
          inputStub.withArgs('version', { required: true }).returns('1.0.0')
          inputStub.withArgs('owner').returns('owner')
          inputStub.withArgs('repo').returns('')

          const core = {
            getInput: inputStub,
            setFailed: setFailedSpy,
            info: infoSpy
          } as unknown as Core

          const github = {
            context: {
              repo: {
                owner: 'owner',
                repo: 'repo'
              }
            }
          } as GitHub

          await run(core, github)

          assert.isTrue(infoSpy.calledOnce)
          assert.equal(infoSpy.args[0][0], 'Getting issues for owner/repo...')
        })
      })
    })
  })

  describe('when listing issues', () => {
    describe('throws a non-zero exit code', () => {
      it('catches the error', async () => {
        inputStub.withArgs('version', { required: true }).returns('1.0.0')
        inputStub.withArgs('owner').returns('owner')
        inputStub.withArgs('repo').returns('repo')

        execStub.returns({
          stdout: '',
          stderr: 'BOOM',
          exitCode: 1
        })

        const core = {
          getInput: inputStub,
          info: infoSpy,
          setFailed: setFailedSpy
        } as unknown as Core

        const github = {
          context: {
            repo: {
              owner: 'owner',
              repo: 'repo'
            }
          }
        } as GitHub

        await run(core, github)

        assert.isTrue(setFailedSpy.calledOnce)
        assert.equal(setFailedSpy.args[0][0], 'Error getting issues: \nBOOM')
      })
    })

    describe('succeeds', () => {
      it('calls gh issue list with the correct arguments', async () => {
        inputStub.withArgs('version', { required: true }).returns('1.0.0')
        inputStub.withArgs('owner').returns('')
        inputStub.withArgs('repo').returns('')

        execStub.returns({
          stdout: '',
          stderr: '',
          exitCode: 0
        })

        const core = {
          getInput: inputStub,
          info: infoSpy,
          setFailed: setFailedSpy
        } as unknown as Core

        const github = {
          context: {
            repo: {
              owner: 'owner',
              repo: 'repo'
            }
          }
        } as GitHub

        await run(core, github)

        assert.isTrue(execStub.calledOnce)
        assert.equal(
          execStub.args[0][0],
          'gh issue list --repo owner/repo --label release --state open --json url,title --search "owner/repo v1.0.0"'
        )
      })
    })

    describe('when passed owner and', () => {
      it('calls gh issue list with the correct arguments', async () => {
        inputStub.withArgs('version', { required: true }).returns('1.0.0')
        inputStub.withArgs('owner').returns('other-owner')
        inputStub.withArgs('repo').returns('docs')

        execStub.returns({
          stdout: '',
          stderr: '',
          exitCode: 0
        })

        const core = {
          getInput: inputStub,
          info: infoSpy,
          setFailed: setFailedSpy
        } as unknown as Core

        const github = {
          context: {
            repo: {
              owner: 'owner',
              repo: 'actual-repo'
            }
          }
        } as GitHub

        await run(core, github)

        assert.isTrue(execStub.calledOnce)
        assert.equal(
          execStub.args[0][0],
          'gh issue list --repo other-owner/docs --label release --state open --json url,title --search "owner/actual-repo v1.0.0"'
        )
      })
    })

    describe('when no issues are found', () => {
      it('warns the user', async () => {
        inputStub.withArgs('version', { required: true }).returns('1.0.0')
        inputStub.withArgs('owner').returns('owner')
        inputStub.withArgs('repo').returns('repo')

        execStub.returns({
          stdout: '[]',
          stderr: '',
          exitCode: 0
        })

        const core = {
          getInput: inputStub,
          info: infoSpy,
          setFailed: setFailedSpy,
          warning: warningSpy
        } as unknown as Core

        const github = {
          context: {
            repo: {
              owner: 'owner',
              repo: 'repo'
            }
          }
        } as GitHub

        await run(core, github)

        assert.isTrue(warningSpy.calledOnce)
        assert.equal(
          warningSpy.args[0][0],
          'No issues found for owner/repo v1.0.0. It may have already been closed...'
        )
      })
    })

    describe('when more than one issue is found', () => {
      it('throws an error', async () => {
        inputStub.withArgs('version', { required: true }).returns('1.0.0')
        inputStub.withArgs('owner').returns('owner')
        inputStub.withArgs('repo').returns('repo')

        execStub.returns({
          stdout:
            '[{"url":"url1","title":"title1"},{"url":"url2","title":"title2"}]',
          stderr: '',
          exitCode: 0
        })

        const core = {
          getInput: inputStub,
          info: infoSpy,
          setFailed: setFailedSpy,
          warning: warningSpy
        } as unknown as Core

        const github = {
          context: {
            repo: {
              owner: 'owner',
              repo: 'repo'
            }
          }
        } as GitHub

        await run(core, github)

        assert.isTrue(setFailedSpy.calledOnce)
        assert.equal(
          setFailedSpy.args[0][0],
          'Found 2 issues for owner/repo v1.0.0. Please manually verify...'
        )
      })
    })

    describe('when one issue is found', () => {
      it('sets the issue-url output', async () => {
        inputStub.withArgs('version', { required: true }).returns('1.0.0')
        inputStub.withArgs('owner').returns('owner')
        inputStub.withArgs('repo').returns('repo')

        execStub.returns({
          stdout: '[{"url":"url1","title":"title1"}]',
          stderr: '',
          exitCode: 0
        })

        const core = {
          getInput: inputStub,
          info: infoSpy,
          setFailed: setFailedSpy,
          warning: warningSpy,
          setOutput: setOutputSpy
        } as unknown as Core

        const github = {
          context: {
            repo: {
              owner: 'owner',
              repo: 'repo'
            }
          }
        } as GitHub

        await run(core, github)

        assert.isTrue(setOutputSpy.calledOnce)
        assert.equal(setOutputSpy.args[0][0], 'issue-url')
        assert.equal(setOutputSpy.args[0][1], 'url1')
      })
    })
  })

  describe.only('when an unexpected error occurs', () => {
    it('catches the error', async () => {
      const core = {
        getInput() {
          throw new Error('BOOM!')
        },
        setFailed: setFailedSpy
      } as unknown as Core

      const github = {
        context: {
          repo: {
            owner: 'owner',
            repo: 'repo'
          }
        }
      } as GitHub

      await run(core, github)

      assert.isTrue(setFailedSpy.calledOnce)
      assert.equal(setFailedSpy.args[0][0], 'BOOM!')
    })
  })
})
