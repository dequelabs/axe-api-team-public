import sinon from 'sinon'
import { assert } from 'chai'
import run from './run'
import { Core, GitHub } from './types'
import * as getFiles from './getFiles'

describe('run()', () => {
  afterEach(() => {
    sinon.restore()
  })

  it('fails if required inputs are not given', () => {
    const core = {
      getInput: sinon
        .stub()
        .withArgs('changed-files-path', { required: true })
        .throws({ message: 'changed-files-path input is not given' }),
      setFailed: sinon.spy()
    }
    const github = {}

    run(core as unknown as Core, github as unknown as GitHub)
    assert.isTrue(
      core.setFailed.calledOnceWith('changed-files-path input is not given')
    )
  })

  it('should run successfully', async () => {
    const getFilesStub = sinon.stub(getFiles, 'getFiles').returns({
      changedFiles: ['file1.txt'],
      importantFiles: ['file1.txt']
    })

    const octokit = {
      rest: {
        pulls: {
          listReviews: sinon.stub().resolves({
            data: [{ state: 'APPROVED' }, { state: 'APPROVED' }]
          })
        }
      },
      request: sinon.spy()
    }

    const core = {
      getInput: sinon.stub().callsFake((name: string) => {
        switch (name) {
          case 'changed-files-path':
            return 'changed-files-path'
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

    getFilesStub.restore()
  })

  it('should fail if not enough reviewers', async () => {
    const getFilesStub = sinon.stub(getFiles, 'getFiles').returns({
      changedFiles: ['file1.txt'],
      importantFiles: ['file1.txt']
    })

    const octokit = {
      rest: {
        pulls: {
          listReviews: sinon.stub().resolves({
            data: []
          })
        }
      },
      request: sinon.spy()
    }

    const core = {
      getInput: sinon.stub().callsFake((name: string) => {
        switch (name) {
          case 'changed-files-path':
            return 'changed-files-path'
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
          conclusion: 'failure'
        })
      )
    )

    getFilesStub.restore()
  })
})
