import sinon from 'sinon'
import { assert } from 'chai'

import type { Core, Github } from './types'
import {
  BUG_PULL_REQUEST,
  RELEASE_PULL_REQUEST
} from './isReleaseInProgress.test'
import run from './run'

const testCases = [
  {
    description: 'when there is not a release pull request',
    pullRequests: [BUG_PULL_REQUEST],
    result: false
  },
  {
    description: 'when there is a release pull request',
    pullRequests: [RELEASE_PULL_REQUEST],
    result: true
  }
]

describe('run()', () => {
  afterEach(() => {
    sinon.restore()
  })

  it('fails if github-token input is not given', () => {
    const core = {
      getInput: sinon
        .stub()
        .withArgs('github-token', { required: true })
        .throws({ message: 'github-token input is not given' }),
      setFailed: sinon.spy()
    }
    const github = {}

    run(core as unknown as Core, github as unknown as Github)
    assert.isTrue(
      core.setFailed.calledOnceWith('github-token input is not given')
    )
  })

  testCases.map(({ description, pullRequests, result }) => {
    describe(description, () => {
      it(`sets is-release-in-Progress output to ${result}`, async () => {
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
            .withArgs('github-token', { required: true })
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
          core.setOutput.calledOnceWith('is-release-in-progress', result)
        )
        assert.isTrue(
          core.info.calledOnceWith(
            `Set is-release-in-progress output: ${result}`
          )
        )
      })
    })
  })
})
