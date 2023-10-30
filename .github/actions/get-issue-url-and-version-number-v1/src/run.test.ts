import 'mocha'
import { assert } from 'chai'
import sinon from 'sinon'
import * as exec from '@actions/exec'
import type { Core, GitHub } from './types'
import run from './run'

describe('run', () => {
  let info: sinon.SinonStub
  let setFailed: sinon.SinonStub
  let setOutput: sinon.SinonStub
  let getExecOutput: sinon.SinonStub

  beforeEach(() => {
    info = sinon.stub()
    setFailed = sinon.stub()
    setOutput = sinon.stub()
    getExecOutput = sinon.stub(exec, 'getExecOutput')
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('when getting an issue returns a non-zero exit code', () => {
    it('sets the action as failed', async () => {
      const core = { info, setFailed } as unknown as Core
      const github = {
        context: {
          repo: {
            owner: 'owner',
            repo: 'repo'
          }
        }
      } as unknown as GitHub

      getExecOutput.resolves({
        stdout: '',
        stderr: 'BOOM',
        exitCode: 1
      })

      await run(core, github)

      assert.isTrue(setFailed.calledWith('Error getting issue:\nBOOM'))
    })
  })

  describe('when the version number cannot be found in the issue title', () => {
    it('sets the action as failed', async () => {
      const core = { info, setFailed } as unknown as Core
      const github = {
        context: {
          repo: {
            owner: 'owner',
            repo: 'repo'
          }
        }
      } as unknown as GitHub

      const url = 'https://github.com/owner/repo/issues/1'
      const title = 'chore: RC BOOM'

      getExecOutput.resolves({
        stdout: JSON.stringify([
          {
            url,
            title
          }
        ]),
        stderr: '',
        exitCode: 0
      })

      await run(core, github)

      assert.isTrue(
        getExecOutput.calledWith(
          'gh issue list --repo owner/repo --label release --state open --json url,title'
        )
      )

      assert.isTrue(
        setFailed.calledWith('Could not find version number in issue title')
      )
    })
  })

  describe('when issue is found', () => {
    it('sets issue URL and version number as output', async () => {
      const core = { info, setOutput } as unknown as Core
      const github = {
        context: {
          repo: {
            owner: 'owner',
            repo: 'repo'
          }
        }
      } as unknown as GitHub

      const url = 'https://github.com/owner/repo/issues/1'
      const title = 'chore: RC v1.33.7'
      getExecOutput.resolves({
        stdout: JSON.stringify([
          {
            url,
            title
          }
        ]),
        stderr: '',
        exitCode: 0
      })

      await run(core, github)

      assert.isTrue(
        getExecOutput.calledWith(
          'gh issue list --repo owner/repo --label release --state open --json url,title'
        )
      )

      assert.equal(setOutput.callCount, 2)
      assert.equal(setOutput.getCall(0).lastArg, url)
      assert.equal(setOutput.getCall(1).lastArg, '1.33.7')
    })
  })
})
