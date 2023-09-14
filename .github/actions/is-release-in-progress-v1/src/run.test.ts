import sinon from 'sinon'
import { assert } from 'chai'

import type { Core, Github } from './types'
import {
  BUG_PULL_REQUEST,
  RELEASE_PULL_REQUEST
} from './is-release-in-progress.test'
import run from './run'

const testCases = [
  {
    description: 'when there is not a release pull request',
    pullRequests: [BUG_PULL_REQUEST],
    isReleaseInProgress: false
  },
  {
    description: 'when there is a release pull request',
    pullRequests: [RELEASE_PULL_REQUEST],
    isReleaseInProgress: true
  }
]

describe('run()', () => {
  afterEach(() => {
    sinon.restore()
  })

  it('fails if githubToken is not given', () => {
    const core = {
      getInput: sinon
        .stub()
        .withArgs('githubToken', { required: true })
        .throws({ message: 'githubToken input is not given' }),
      setFailed: sinon.spy()
    }
    const github = {}

    run(core as unknown as Core, github as unknown as Github)
    assert.isTrue(
      core.setFailed.calledOnceWith('githubToken input is not given')
    )
  })

  testCases.map(({ description, pullRequests, isReleaseInProgress }) => {
    describe(description, () => {
      it(`sets isReleaseInProgress output to ${isReleaseInProgress}`, async () => {
        const octokit = {
          rest: {
            pulls: {
              list: sinon.stub().resolves({ data: pullRequests })
            }
          }
        }
        const core = {
          getInput: sinon
            .stub()
            .withArgs('githubToken', { required: true })
            .returns('token'),
          setOutput: sinon.spy(),
          info: sinon.spy()
        }
        const github = {
          getOctokit: sinon
            .stub()
            .withArgs(sinon.match.string)
            .returns(octokit),
          context: {
            repo: {
              owner: 'OWNER',
              repo: 'REPO'
            }
          }
        }

        await run(core as unknown as Core, github as unknown as Github)

        assert.isTrue(
          core.setOutput.calledOnceWith(
            'isReleaseInProgress',
            isReleaseInProgress
          )
        )
        assert.isTrue(
          core.info.calledOnceWith('Set isReleaseInProgress output')
        )
      })
    })
  })
})
