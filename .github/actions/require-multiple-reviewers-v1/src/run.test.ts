import sinon from 'sinon'
import { assert } from 'chai'
import run from './run'
import { Core, GitHub } from './types'
import * as utils from './utils'

describe('run()', () => {
  afterEach(() => {
    sinon.restore()
  })

  it('fails if required inputs are not given', () => {
    const core = {
      getInput: sinon
        .stub()
        .withArgs('token', { required: true })
        .throws({ message: 'token input is not given' }),
      setFailed: sinon.spy()
    }
    const github = {
      context: {
        repo: {
          owner: 'owner',
          repo: 'repo'
        },
        payload: {
          pull_request: {
            number: 1,
            head: {
              sha: 'commit-sha'
            }
          }
        }
      }
    }

    run(core as unknown as Core, github as unknown as GitHub)
    assert.isTrue(core.setFailed.calledOnceWith('token input is not given'))
  })

  it('should run successfully', async () => {
    const octokit = {
      rest: {
        pulls: {
          listReviews: sinon.stub().resolves({
            data: [{ state: 'APPROVED' }, { state: 'APPROVED' }]
          }),
          listFiles: sinon.stub().resolves({
            data: [
              { status: 'added', filename: 'file1' },
              { status: 'added', filename: 'file2' }
            ]
          })
        }
      },
      request: sinon.spy()
    }

    const core = {
      getInput: sinon.stub().callsFake((name: string) => {
        switch (name) {
          case 'important-files-path':
            return 'important-files-path'
          case 'number-of-reviewers':
            return '2'
          case 'token':
            return 'token'
          default:
            throw new Error(`Unexpected input: ${name}`)
        }
      }),
      setOutput: sinon.spy(),
      setFailed: sinon.spy(),
      info: sinon.spy()
    }

    const github = {
      getOctokit: sinon.stub().withArgs(sinon.match.string).returns(octokit),
      context: {
        repo: {
          owner: 'owner',
          repo: 'repo'
        },
        payload: {
          pull_request: {
            number: 1,
            head: {
              sha: 'commit-sha'
            }
          }
        }
      }
    }

    const getImportantFilesChanged = sinon
      .stub(utils, 'getImportantFilesChanged')
      .returns(['file1', 'file2'])

    const getApproversCount = sinon.stub(utils, 'getApproversCount').returns(2)

    await run(core as unknown as Core, github as unknown as GitHub)

    assert.isTrue(core.setFailed.notCalled)

    assert.isTrue(octokit.rest.pulls.listReviews.calledOnce)
    assert.isTrue(
      octokit.rest.pulls.listReviews.calledWithMatch({
        owner: 'owner',
        repo: 'repo',
        pull_number: 1
      })
    )

    assert.isTrue(octokit.request.calledOnce)
    assert.isTrue(
      octokit.request.calledWithMatch(
        'POST /repos/{owner}/{repo}/check-runs',
        sinon.match({
          conclusion: 'success'
        })
      )
    )

    getImportantFilesChanged.restore()
    getApproversCount.restore()
  })

  it('should fail if not enough reviewers', async () => {
    const octokit = {
      rest: {
        pulls: {
          listReviews: sinon.stub().resolves({
            data: []
          }),
          listFiles: sinon.stub().resolves({
            data: [
              { status: 'added', filename: 'file1' },
              { status: 'added', filename: 'file2' }
            ]
          })
        }
      },
      request: sinon.spy()
    }

    const core = {
      getInput: sinon.stub().callsFake((name: string) => {
        switch (name) {
          case 'important-files-path':
            return 'important-files-path'
          case 'number-of-reviewers':
            return '2'
          case 'token':
            return 'token'
          default:
            throw new Error(`Unexpected input: ${name}`)
        }
      }),
      setOutput: sinon.spy(),
      setFailed: sinon.spy(),
      info: sinon.spy()
    }

    const github = {
      getOctokit: sinon.stub().withArgs(sinon.match.string).returns(octokit),
      context: {
        repo: {
          owner: 'owner',
          repo: 'repo'
        },
        payload: {
          pull_request: {
            number: 1,
            head: {
              sha: 'commit-sha'
            }
          }
        }
      }
    }

    const getImportantFilesChanged = sinon
      .stub(utils, 'getImportantFilesChanged')
      .returns(['file1', 'file2'])

    const getApproversCount = sinon.stub(utils, 'getApproversCount').returns(0)

    await run(core as unknown as Core, github as unknown as GitHub)

    assert.isTrue(core.setFailed.notCalled)

    assert.isTrue(
      octokit.rest.pulls.listFiles.calledWithMatch({
        owner: 'owner',
        repo: 'repo',
        pull_number: 1
      })
    )
    assert.isTrue(octokit.rest.pulls.listReviews.calledOnce)
    assert.isTrue(
      octokit.rest.pulls.listReviews.calledWithMatch({
        owner: 'owner',
        repo: 'repo',
        pull_number: 1
      })
    )

    assert.isTrue(octokit.request.calledOnce)
    assert.isTrue(
      octokit.request.calledWithMatch(
        'POST /repos/{owner}/{repo}/check-runs',
        sinon.match({
          conclusion: 'failure'
        })
      )
    )

    getImportantFilesChanged.restore()
    getApproversCount.restore()
  })

  it('should fail if number-of-reviewers is not a number', async () => {
    const core = {
      getInput: sinon.stub().callsFake((name: string) => {
        switch (name) {
          case 'important-files-path':
            return 'important-files-path'
          case 'number-of-reviewers':
            return 'not-a-number'
          case 'token':
            return 'token'
          default:
            throw new Error(`Unexpected input: ${name}`)
        }
      }),
      setOutput: sinon.spy(),
      setFailed: sinon.spy(),
      info: sinon.spy()
    }

    const github = {
      context: {
        repo: {
          owner: 'owner',
          repo: 'repo'
        },
        payload: {
          pull_request: {
            number: 1,
            head: {
              sha: 'commit-sha'
            }
          }
        }
      }
    }

    await run(core as unknown as Core, github as unknown as GitHub)

    assert.isTrue(
      core.setFailed.calledOnceWith('number-of-reviewers input is not a number')
    )
  })

  it('should fail if not in a pull request context', async () => {
    const core = {
      getInput: sinon.stub().returns('token'),
      setFailed: sinon.spy()
    }
    const github = {
      context: {
        payload: {}
      }
    }

    await run(core as unknown as Core, github as unknown as GitHub)

    assert.isTrue(
      core.setFailed.calledOnceWith(
        'This action can only be run in the context of a pull request.'
      )
    )
  })

  it('should catch an error and set failed', async () => {
    const core = {
      setFailed: sinon.spy()
    }
    const github = {}

    await run(core as unknown as Core, github as unknown as GitHub)

    assert.isTrue(
      core.setFailed.calledOnceWith(
        "Cannot read properties of undefined (reading 'payload')"
      )
    )
  })
})
