import sinon from 'sinon'
import { assert } from 'chai'
import type { Core } from './types'
import * as exec from '@actions/exec'
import run from './run'
import {
  expectedParsedCommitList,
  rawCommitList,
  rawRepositoryURL
} from './test-utils'

describe('run', () => {
  let core: Core
  let setFailed: sinon.SinonSpy
  let setOutput: sinon.SinonSpy
  let getInput: sinon.SinonStub
  let info: sinon.SinonSpy
  let getExecOutputStub: sinon.SinonStub

  beforeEach(() => {
    getExecOutputStub = sinon.stub(exec, 'getExecOutput')
    setFailed = sinon.spy()
    setOutput = sinon.spy()
    getInput = sinon.stub()
    info = sinon.spy()

    core = {
      setFailed,
      setOutput,
      getInput,
      info
    }
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('when the base input is not provided', () => {
    it('should throw an error', async () => {
      getInput.withArgs('base', { required: true }).throws({
        message: 'Input required and not supplied: base'
      })

      await run(core)

      assert.isTrue(setFailed.calledOnce)
      assert.isTrue(
        setFailed.calledWith('Input required and not supplied: base')
      )
    })
  })

  describe('when the head input is not provided', () => {
    it('should throw an error', async () => {
      getInput.withArgs('base', { required: true }).returns('main')
      getInput.withArgs('head', { required: true }).throws({
        message: 'Input required and not supplied: head'
      })

      await run(core)

      assert.isTrue(setFailed.calledOnce)
      assert.isTrue(
        setFailed.calledWith('Input required and not supplied: head')
      )
    })
  })

  describe('when the base branch does not exist', () => {
    it('should throw an error', async () => {
      getInput.withArgs('base', { required: true }).returns('main')
      getExecOutputStub.throws({
        exitCode: 1,
        stdout: '',
        stderr: 'welp, we tried'
      })

      await run(core)

      assert.isTrue(setFailed.calledOnce)
      assert.isTrue(
        setFailed.calledWith('The base branch main does not exist.')
      )
    })
  })

  describe('when the head branch does not exist', () => {
    it('should throw an error', async () => {
      getInput.withArgs('base', { required: true }).returns('main')
      getInput.withArgs('head', { required: true }).returns('my-branch-name')
      getExecOutputStub
        .onFirstCall()
        .resolves({
          exitCode: 0,
          stdout: 'hazaar!'
        })
        .onSecondCall()
        .throws({
          exitCode: 1,
          stdout: '',
          stderr: 'welp, we tried'
        })

      await run(core)

      assert.isTrue(setFailed.calledOnce)
      assert.isTrue(
        setFailed.calledWith('The head branch my-branch-name does not exist.')
      )
    })
  })

  describe('when the base and head branches exist', () => {
    it('should set the output', async () => {
      getInput.withArgs('base', { required: true }).returns('main')
      getInput.withArgs('head', { required: true }).returns('my-branch-name')

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

      // Stub: getRepositoryURL
      getExecOutputStub.onCall(3).resolves({
        exitCode: 0,
        stdout: rawRepositoryURL
      })

      await run(core)

      assert.isTrue(setOutput.calledOnce)
      assert.isTrue(setOutput.calledWith('commit-list'))

      const output = setOutput.args[0][1]
      assert.deepEqual(JSON.parse(output), expectedParsedCommitList)
    })
  })
})
