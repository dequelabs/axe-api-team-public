import 'mocha'
import sinon from 'sinon'
import { assert } from 'chai'
import * as exec from '@actions/exec'
import run from './run'
import type { Core, GitHub, Issues } from './types'

describe('run', () => {
  let getInput: sinon.SinonStub
  let setFailed: sinon.SinonSpy
  let setOutput: sinon.SinonSpy
  let info: sinon.SinonSpy
  let getExecOutputStub: sinon.SinonStub

  beforeEach(() => {
    getInput = sinon.stub()
    setFailed = sinon.spy()
    setOutput = sinon.spy()
    info = sinon.spy()
    getExecOutputStub = sinon.stub(exec, 'getExecOutput')
  })

  afterEach(sinon.restore)

  const getReleaseIssueRun = async (ownerAndRepo = '') => {
    const issue = {
      url: 'https://github.com/dequelabs/axe-api-team-public/issues/1',
      title: `${ownerAndRepo || 'dequelabs/axe-api-team-public'} v1.0.0`
    } as const

    getInput.withArgs('version', { required: true }).returns('1.0.0')
    getInput.withArgs('owner-and-repo').returns(ownerAndRepo)
    getExecOutputStub.returns({
      stdout: JSON.stringify([
        {
          url: 'https://github.com/dequelabs/axe-api-team-public/issues/1',
          title: `${ownerAndRepo || 'dequelabs/axe-api-team-public'} v1.0.0`
        }
      ])
    })

    const core = {
      getInput,
      setFailed,
      setOutput,
      info
    }

    const github = {
      context: {
        repo: {
          owner: 'dequelabs',
          repo: 'axe-api-team-public'
        }
      }
    }

    await run(core as unknown as Core, github as unknown as GitHub)

    return { core, issue }
  }

  describe('given `version` input is not provided', () => {
    it('throws an error', async () => {
      getInput.withArgs('version', { required: true }).throws({
        message: 'Input required and not supplied: version'
      })

      const core = {
        getInput,
        setFailed
      }

      const github = {
        context: {
          repo: {
            owner: 'dequelabs',
            repo: 'axe-api-team-public'
          }
        }
      }

      await run(core as unknown as Core, github as unknown as GitHub)

      assert.isTrue(core.setFailed.calledOnce)
      assert.isTrue(
        core.setFailed.calledWith('Input required and not supplied: version')
      )
    })
  })

  describe('given `owner-and-repo` input is not provided', () => {
    it('uses the `owner` and `repo` from the github context and sets the output', async () => {
      const { core, issue } = await getReleaseIssueRun()

      assert.isTrue(
        core.info.firstCall.calledWith(
          'Getting issues for dequelabs/axe-api-team-public v1.0.0...'
        )
      )

      assert.isTrue(getExecOutputStub.calledOnce)
      assert.isTrue(
        getExecOutputStub.calledWith(
          'gh issue list --repo dequelabs/axe-api-team-public --label release --state open --json url,title'
        )
      )

      assert.isTrue(core.info.calledTwice)
      assert.isTrue(
        core.info.secondCall.calledWith(
          `Found issue: ${issue.url}. Setting "issue-url" output...`
        )
      )

      assert.isTrue(setOutput.calledOnce)
      assert.isTrue(setOutput.calledWith('issue-url', issue.url))
    })
  })

  describe('given `owner-and-repo` input is provided', () => {
    describe('and the `owner-and-repo` input is valid', () => {
      describe('and the `owner-and-repo` has issues', () => {
        it('sets the `issue-url` output', async () => {
          const { core, issue } = await getReleaseIssueRun(
            'dequelabs/moar-coffee'
          )

          assert.isTrue(
            core.info.firstCall.calledWith(
              'Getting issues for dequelabs/moar-coffee v1.0.0...'
            )
          )

          assert.isTrue(getExecOutputStub.calledOnce)
          assert.isTrue(
            getExecOutputStub.calledWith(
              'gh issue list --repo dequelabs/moar-coffee --label release --state open --json url,title'
            )
          )

          assert.isTrue(core.info.calledTwice)
          assert.isTrue(
            core.info.secondCall.calledWith(
              `Found issue: ${issue.url}. Setting "issue-url" output...`
            )
          )

          assert.isTrue(setOutput.calledOnce)
          assert.isTrue(setOutput.calledWith('issue-url', issue.url))
        })
      })

      describe('and the `owner-and-repo` does not have issues', () => {
        it('throws an error', async () => {
          getInput.withArgs('version', { required: true }).returns('1.0.0')
          getInput.withArgs('owner-and-repo').returns('dequelabs/moar-coffee')
          getExecOutputStub.returns({
            stdout: JSON.stringify([])
          })

          const core = {
            getInput,
            setFailed,
            setOutput,
            info
          }

          const github = {
            context: {
              repo: {
                owner: 'dequelabs',
                repo: 'axe-api-team-public'
              }
            }
          }

          await run(core as unknown as Core, github as unknown as GitHub)

          assert.isTrue(core.setFailed.calledOnce)
          assert.isTrue(
            core.setFailed.calledWith(
              'No issue found for dequelabs/moar-coffee v1.0.0'
            )
          )
        })
      })
    })
  })

  describe('when the `gh issue list` returns multiple issues', () => {
    it('finds the correct issue and sets the output', async () => {
      const issueList: Issues = [
        {
          url: 'https://github.com/dequelabs/moar-coffee/issues/1',
          title: 'dequelabs/moar-coffee v1.0.0'
        },
        {
          url: 'https://github.com/dequelabs/moar-coffee/issues/2',
          title: 'dequelabs/moar-coffee v1.1.0'
        }
      ]

      getInput.withArgs('version', { required: true }).returns('1.0.0')
      getInput.withArgs('owner-and-repo').returns('dequelabs/moar-coffee')
      getExecOutputStub.returns({
        stdout: JSON.stringify(issueList)
      })

      const core = {
        getInput,
        setOutput,
        info
      }

      const github = {
        context: {
          repo: {
            owner: 'dequelabs',
            repo: 'axe-api-team-public'
          }
        }
      }

      await run(core as unknown as Core, github as unknown as GitHub)

      assert.isTrue(
        core.info.secondCall.calledWith(
          `Found issue: ${issueList[0].url}. Setting "issue-url" output...`
        )
      )
    })
  })

  describe('when the `owner-and-repo` points to the docs repo', () => {
    it('locates the correct issue', async () => {
      const issueList: Issues = [
        {
          url: 'https://github.com/dequelabs/moar-coffee/issues/1',
          title: 'dequelabs/moar-coffee v1.0.0'
        }
      ]

      getInput.withArgs('version', { required: true }).returns('1.0.0')
      getInput.withArgs('owner-and-repo').returns('dequelabs/docs-moar-coffee')

      getExecOutputStub.returns({
        stdout: JSON.stringify(issueList)
      })

      const core = {
        getInput,
        setOutput,
        info
      }

      const github = {
        context: {
          repo: {
            owner: 'dequelabs',
            repo: 'moar-coffee'
          }
        }
      }

      await run(core as unknown as Core, github as unknown as GitHub)

      assert.isTrue(
        core.info.secondCall.calledWith(
          `Found issue: ${issueList[0].url}. Setting "issue-url" output...`
        )
      )
    })
  })

  describe('when the `gh issue list` command fails', () => {
    it('throws an error', async () => {
      getInput.withArgs('version', { required: true }).returns('1.0.0')
      getInput.withArgs('owner-and-repo').returns('dequelabs/moar-coffee')
      getExecOutputStub.returns({
        stdout: '',
        stderr: 'welp, we tried',
        exitCode: 1
      })

      const core = {
        getInput,
        setFailed,
        setOutput,
        info
      }

      const github = {
        context: {
          repo: {
            owner: 'dequelabs',
            repo: 'axe-api-team-public'
          }
        }
      }

      await run(core as unknown as Core, github as unknown as GitHub)

      assert.isTrue(core.setFailed.calledOnce)
      assert.isTrue(
        core.setFailed.calledWith('Error getting issues: \nwelp, we tried')
      )
    })
  })
})
