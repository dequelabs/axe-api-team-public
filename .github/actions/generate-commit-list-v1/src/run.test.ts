import sinon from 'sinon'
import { assert } from 'chai'
import type { Core, Github } from './types'
import * as exec from '@actions/exec'
import run from './run'
import {
  expectedParsedCommitList,
  rawCommitList,
  expectedRepository
} from './testUtils'

describe('run', () => {
  let setFailed: sinon.SinonSpy
  let setOutput: sinon.SinonSpy
  let info: sinon.SinonSpy
  let getInput: sinon.SinonStub
  let getExecOutputStub: sinon.SinonStub
  const [owner, repo] = expectedRepository.split('/')
  const github = {
    context: {
      repo: { owner, repo }
    }
  }

  beforeEach(() => {
    getExecOutputStub = sinon.stub(exec, 'getExecOutput')
    setFailed = sinon.spy()
    setOutput = sinon.spy()
    info = sinon.spy()
    getInput = sinon.stub()
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('when the base input is not provided', () => {
    it('should throw an error', async () => {
      getInput.withArgs('base').returns('')

      const core = {
        getInput,
        setFailed
      }

      await run(core as unknown as Core, github as unknown as Github)

      assert.isTrue(setFailed.calledOnce)
      assert.isTrue(
        setFailed.calledWith(
          'You must provide either a tag or both a base and head branch.'
        )
      )
    })
  })

  describe('when the head input is not provided', () => {
    it('should throw an error', async () => {
      getInput.withArgs('base', { required: true }).returns('main')
      getInput.withArgs('head', { required: true }).returns('')

      const core = {
        getInput,
        setFailed
      }

      await run(core as unknown as Core, github as unknown as Github)

      assert.isTrue(setFailed.calledOnce)
      assert.isTrue(
        setFailed.calledWith(
          'You must provide either a tag or both a base and head branch.'
        )
      )
    })
  })

  describe('when the tag input is provided', () => {
    describe('and the base input is provided', () => {
      it('should throw an error', async () => {
        getInput.withArgs('base').returns('main')
        getInput.withArgs('head').returns('')
        getInput.withArgs('tag').returns('v1.0.0')

        const core = {
          getInput,
          setFailed
        }

        await run(core as unknown as Core, github as unknown as Github)

        assert.isTrue(setFailed.calledOnce)
        assert.isTrue(
          setFailed.calledWith(
            'You cannot provide both a tag and both a base and head branch.'
          )
        )
      })
    })

    describe('and the head input is provided', () => {
      it('should throw an error', async () => {
        getInput.withArgs('base').returns('')
        getInput.withArgs('head').returns('my-branch-name')
        getInput.withArgs('tag').returns('v1.0.0')

        const core = {
          getInput,
          setFailed
        }

        await run(core as unknown as Core, github as unknown as Github)

        assert.isTrue(setFailed.calledOnce)
        assert.isTrue(
          setFailed.calledWith(
            'You cannot provide both a tag and both a base and head branch.'
          )
        )
      })
    })
  })

  describe('when the base branch does not exist', () => {
    it('should throw an error', async () => {
      getInput.withArgs('base').returns('main')
      getInput.withArgs('head').returns('release')
      getExecOutputStub.throws({
        stdout: ''
      })

      const core = {
        getInput,
        setFailed,
        info
      }

      await run(core as unknown as Core, github as unknown as Github)

      assert.isTrue(info.calledOnce)
      assert.isTrue(info.calledWith('Checking if main exists...'))
      assert.isTrue(setFailed.calledOnce)
      assert.isTrue(
        setFailed.calledWith('The base branch main does not exist.')
      )
    })
  })

  describe('when the head branch does not exist', () => {
    it('should throw an error', async () => {
      getInput.withArgs('base').returns('main')
      getInput.withArgs('head').returns('my-branch-name')
      getExecOutputStub
        .onFirstCall()
        .resolves({
          exitCode: 0,
          stdout: 'hazaar!'
        })
        .onSecondCall()
        .throws({
          stdout: ''
        })

      const core = {
        getInput,
        setFailed,
        info
      }

      await run(core as unknown as Core, github as unknown as Github)

      assert.isTrue(info.calledTwice)
      assert.isTrue(
        info.secondCall.calledWith('Checking if my-branch-name exists...')
      )
      assert.isTrue(core.setFailed.calledOnce)
      assert.isTrue(
        core.setFailed.calledWith(
          'The head branch my-branch-name does not exist.'
        )
      )
    })
  })

  describe('when the base and head branches exist', () => {
    it('should set the output', async () => {
      getInput.withArgs('base').returns('main')
      getInput.withArgs('head').returns('my-branch-name')

      // Stub: doesBranchExist (base)
      getExecOutputStub.onFirstCall().resolves({
        exitCode: 0,
        stdout: 'hazaar!'
      })

      // Stub: doesBranchExist (head)
      getExecOutputStub.onSecondCall().resolves({
        exitCode: 0,
        stdout: 'hazaar!'
      })

      // Stub: getRawCommitList
      getExecOutputStub.onThirdCall().resolves({
        exitCode: 0,
        stdout: rawCommitList
      })

      // Stub: getFallbackId 1st call
      getExecOutputStub.onCall(3).resolves({
        stdout: '',
        stderr: '',
        exitCode: 0
      })

      // Stub: getFallbackId 2nd call
      getExecOutputStub.onCall(4).resolves({
        stdout: '456',
        stderr: '',
        exitCode: 0
      })

      const core = {
        getInput,
        setFailed,
        setOutput,
        info
      }

      await run(core as unknown as Core, github as unknown as Github)

      assert.equal(info.callCount, 7)
      assert.isTrue(setOutput.calledOnce)
      assert.isTrue(setOutput.calledWith('commit-list'))

      const output = setOutput.args[0][1]
      assert.deepEqual(JSON.parse(output), expectedParsedCommitList)
    })
  })

  describe('when the tag does not exist', () => {
    it('should throw an error', async () => {
      getInput.withArgs('tag').returns('v1.0.0')
      getExecOutputStub.throws({
        stdout: ''
      })

      const core = {
        getInput,
        setFailed,
        info
      }

      await run(core as unknown as Core, github as unknown as Github)

      assert.isTrue(setFailed.calledOnce)
      assert.isTrue(setFailed.calledWith('The tag v1.0.0 does not exist.'))
    })
  })

  describe('when the tag exists', () => {
    describe('and base and head are not provided', () => {
      it('should set the output', async () => {
        getInput.withArgs('tag').returns('v1.0.0')

        // Stub: doesTagExist
        getExecOutputStub.withArgs('git rev-parse --verify v1.0.0').resolves({
          exitCode: 0,
          stderr: '',
          stdout: '46d3d9522335833c526af9f2eda0d988a8fe1bed'
        })

        // Stub: getRawCommitList
        getExecOutputStub
          .withArgs(
            'git log v1.0.0..HEAD --oneline --no-merges --abbrev-commit'
          )
          .resolves({
            exitCode: 0,
            stderr: '',
            stdout: rawCommitList
          })

        // Stub: getFallbackId - rawCommitList[8]
        getExecOutputStub.onCall(2).resolves({
          stdout: '',
          stderr: '',
          exitCode: 0
        })

        // Stub: getFallbackId - rawCommitList[9]
        getExecOutputStub.onCall(3).resolves({
          stdout: '456',
          stderr: '',
          exitCode: 0
        })

        // Stub: getFallbackId - rawCommitList[10]
        getExecOutputStub.onCall(4).resolves({
          stdout: '',
          stderr: '',
          exitCode: 0
        })

        const core = {
          getInput,
          setOutput,
          info
        }

        await run(core as unknown as Core, github as unknown as Github)

        assert.isTrue(setOutput.calledOnce)
        assert.isTrue(setOutput.calledWith('commit-list'))

        const output = setOutput.args[0][1]
        assert.deepEqual(JSON.parse(output), expectedParsedCommitList)
      })
    })
  })

  describe('when an unexpected error occurs', () => {
    it('catches the error', async () => {
      const core = {
        getInput() {
          throw new Error('BOOM!')
        },
        setFailed
      } as unknown as Core

      // We pass {} as we do not expect to use it in this test.
      await run(core, {} as unknown as Github)

      assert.isTrue(setFailed.calledOnce)
      assert.isTrue(setFailed.calledWith('BOOM!'))
    })
  })
})
